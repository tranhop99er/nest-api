// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Account } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { Token } from './interfaces/token.interface';
import { Response, Request } from 'express';
import { MailerService } from '@nestjs-modules/mailer';
import { WithCurrentUser } from 'src/common/types';
import { UserCurrent } from 'src/common/strategies/jwt-payload.interface';
import { IVerify2FA } from './interfaces';
import {
  mappingAccessTokenCookie,
  mappingRefreshTokenCookie,
  extractSiteKeyFromUrl,
} from 'src/common/utils';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'jsonwebtoken';
import { ILogin } from './interfaces/login.interface';
import { API_ERROR_MSG } from 'src/packages/messages';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { mappingPageUrl } from 'src/common/utils/mapping-page-url';
import { ResetPasswordDto } from './dto/reset-password.dto';
// import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}
  private readonly ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private readonly TWO_MINUTES = 2 * 60 * 1000; // 2 minutes in milliseconds

  async login(args: ILogin): Promise<Token & { message: string }> {
    const { email, password, userAgent } = args;

    // Sử dụng phương thức validateAccount để tìm tài khoản
    const account = await this.validateAccount(email, password);

    if (!account) {
      throw new BadRequestException(API_ERROR_MSG.wrongEmailOrPassword);
    }

    // Tạo access token và refresh token
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Kiểm tra xem thiết bị có tin cậy không
    const isTrustedDevice = await this.checkTrustedDevice({
      account,
      userAgent,
    });

    // Nếu thiết bị không tin cậy hoặc thời gian xác thực cuối đã quá hạn 7 ngày
    if (!isTrustedDevice) {
      const twoFaCode = this.generate2FACode();

      // Store the 2FA code temporarily in the database
      await this.prismaService.account.update({
        where: { id: account.id },
        data: {
          twoFaSecret: twoFaCode,
          expiresAtTwoFaSecret: new Date(Date.now() + this.TWO_MINUTES),
        }, // Store temporarily
      });

      await this.mailerService.sendMail({
        to: account.email,
        subject: 'Your 2FA Code',
        template: 'confirm',
        context: {
          role: account.role,
          code: twoFaCode,
        },
      });

      return { accessToken, refreshToken, message: 'verify: fail' };
    }

    await this.prismaService.account.update({
      where: { id: account.id },
      data: { refreshToken }, // Cập nhật refreshToken
    });

    return { accessToken, refreshToken, message: 'verify: true' };
  }

  async verifyTwoFa(
    verify2FA: WithCurrentUser<IVerify2FA>,
    userAgent: string,
  ): Promise<Token> {
    const { currentUser, code } = verify2FA;

    const account = await this.prismaService.account.findUnique({
      where: { id: currentUser.id },
    });

    if (!account) {
      throw new BadRequestException(API_ERROR_MSG.userNotFound);
    }

    // Kiểm tra mã 2FA
    if (
      account.twoFaSecret !== code ||
      account.expiresAtTwoFaSecret < new Date()
    ) {
      throw new BadRequestException(API_ERROR_MSG.invalidCode);
    }

    // Tạo access token và refresh token mới
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Kiểm tra thiết bị đã tồn tại trong danh sách `trustedDevice`
    const isDeviceTrusted = account.trustedDevice.includes(userAgent);

    // Cập nhật refresh token, lastVerifiedAt và trustedDevice vào cơ sở dữ liệu
    await this.prismaService.account.update({
      where: { id: account.id },
      data: {
        refreshToken,
        lastVerifiedAt: new Date(),
        trustedDevice: isDeviceTrusted
          ? account.trustedDevice
          : { push: userAgent }, // Chỉ thêm thiết bị nếu chưa tồn tại
        twoFaSecret: null,
        expiresAtTwoFaSecret: null,
      },
    });

    return { accessToken, refreshToken };
  }

  async register(args: RegisterDto): Promise<Token & { message: string }> {
    return await this.prismaService.$transaction(async (prisma) => {
      const { email, username, password } = args;
      // Kiểm tra xem tài khoản đã tồn tại chưa
      const existingAccount = await prisma.account.findUnique({
        where: { email },
      });

      if (existingAccount) {
        throw new BadRequestException(
          'Account with this email already exists.',
        );
      }

      //Tao mã xác minh 2FA
      const twoFaCode = this.generate2FACode();

      // Mã hóa mật khẩu
      const hashedPassword = await argon2.hash(password);

      // Save data to the database within a transaction
      const newAccount = await prisma.account.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role: 'USER',
          twoFaSecret: twoFaCode,
          expiresAtTwoFaSecret: new Date(Date.now() + this.TWO_MINUTES), // Expiration time 2 minutes
          user: {
            create: {}, // Create user link
          },
        },
        include: {
          user: true,
        },
      });

      // Tạo access token và refresh token
      const { accessToken, refreshToken } = this.signTokens(
        newAccount.id,
        newAccount.email,
        newAccount.role,
      );

      // Gửi email mã xác minh
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 2FA Code',
        template: 'confirm',
        context: {
          role: 'USER',
          code: twoFaCode,
        },
      });

      return {
        accessToken,
        refreshToken,
        message:
          'Verification code sent to your email. Please verify to complete registration.',
      };
    });
  }

  async verifyTwoFa_RegisterNewAccount(
    verify2FA: WithCurrentUser<IVerify2FA>,
    userAgent: string,
  ): Promise<Token> {
    const { currentUser, code } = verify2FA;

    const account = await this.prismaService.account.findUnique({
      where: { id: currentUser.id },
    });

    if (!account) {
      throw new BadRequestException(API_ERROR_MSG.userNotFound);
    }

    // Kiểm tra mã 2FA
    if (
      account.twoFaSecret !== code ||
      account.expiresAtTwoFaSecret < new Date()
    ) {
      await this.prismaService.account.delete({
        where: { id: account.id },
      });
      throw new BadRequestException(API_ERROR_MSG.invalidCode);
    }

    // Tạo access token và refresh token mới
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Kiểm tra thiết bị đã tồn tại trong danh sách `trustedDevice`
    const isDeviceTrusted = account.trustedDevice.includes(userAgent);

    // Cập nhật refresh token, lastVerifiedAt và trustedDevice vào cơ sở dữ liệu
    await this.prismaService.account.update({
      where: { id: account.id },
      data: {
        refreshToken,
        lastVerifiedAt: new Date(),
        trustedDevice: isDeviceTrusted
          ? account.trustedDevice
          : { push: userAgent }, // Chỉ thêm thiết bị nếu chưa tồn tại
        twoFaSecret: null,
        expiresAtTwoFaSecret: null,
      },
    });

    return { accessToken, refreshToken };
  }

  async forgotPassword(args: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = args;
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const account = await this.prismaService.account.findUnique({
      where: { email, status: 'ACTIVE' },
    });

    if (!account) {
      throw new BadRequestException(API_ERROR_MSG.accountNotExist);
    }

    //Tao mã xác minh 2FA
    const twoFaCode = this.generate2FACode();

    await this.prismaService.account.update({
      where: { email },
      data: {
        twoFaSecret: twoFaCode,
        expiresAtTwoFaSecret: new Date(Date.now() + this.TWO_MINUTES), // Thời gian hết hạn 2 phút
      },
    });

    const url = mappingPageUrl[account.role];

    // Gửi email mã xác minh
    this.mailerService.sendMail({
      to: email,
      subject: 'Resest Password',
      template: 'forgot-password',
      context: {
        name: account.username,
        url,
        code: twoFaCode,
      },
    });

    return {
      message: 'Reset password link sent to your email.',
    };
  }

  async resetPassword(
    args: ResetPasswordDto,
    userAgent: string,
  ): Promise<{ message: string }> {
    const { password, code } = args;

    // Kiểm tra mã xác minh (2FA code)
    const account = await this.prismaService.account.findFirst({
      where: {
        twoFaSecret: code,
        expiresAtTwoFaSecret: { gte: new Date() }, // Kiểm tra xem mã có hết hạn hay không
        status: 'ACTIVE',
      },
    });

    if (!account) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await argon2.hash(password);

    // Kiểm tra thiết bị đã tồn tại trong danh sách `trustedDevice`
    const isDeviceTrusted = account.trustedDevice.includes(userAgent);

    // Cập nhật mật khẩu mới và xóa mã xác minh
    await this.prismaService.account.update({
      where: { email: account.email },
      data: {
        password: hashedPassword,
        twoFaSecret: null, // Xóa mã xác minh sau khi đặt lại mật khẩu thành công
        trustedDevice: isDeviceTrusted
          ? account.trustedDevice
          : { push: userAgent }, // Chỉ thêm thiết bị nếu chưa tồn tại
        expiresAtTwoFaSecret: null,
        lastVerifiedAt: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  async getCurrentUser(userId: string): Promise<UserCurrent | null> {
    const user = await this.prismaService.account.findUnique({
      where: { id: userId },
      include: {
        user: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async refreshToken(refreshToken: string): Promise<Token> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload: JwtPayload = await this.jwtService
      .verifyAsync(refreshToken)
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });

    const account = await this.prismaService.account.findUnique({
      where: { id: payload.id },
    });

    // Kiểm tra trạng thái tài khoản
    if (!account || account?.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Refresh token is invalid or account status INACTIVE',
      );
    }

    const { accessToken, refreshToken: newRefreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    await this.prismaService.account.update({
      where: { id: account.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async getCookiesNameFromRequest(request: Request): Promise<{
    accessTokenCookieName: string;
    refreshTokenCookieName: string;
  }> {
    const url = request.url;
    // console.log('URL:', url);
    const siteKey = extractSiteKeyFromUrl(url);
    // console.log('Site key:', siteKey);
    const accessTokenCookieName = mappingAccessTokenCookie[siteKey];
    const refreshTokenCookieName = mappingRefreshTokenCookie[siteKey];
    return {
      accessTokenCookieName,
      refreshTokenCookieName,
    };
  }

  async clearCookie({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }) {
    const { accessTokenCookieName, refreshTokenCookieName } =
      await this.getCookiesNameFromRequest(request);

    response.clearCookie(accessTokenCookieName);
    response.clearCookie(refreshTokenCookieName);
  }

  setCookies(response: Response, token: Token) {
    response.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    });

    response.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    });
  }

  setTokensInCookies(tokens: Token, res: Response) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: this.ONE_WEEK, // 7 days
    });
  }

  // Hàm tạo token
  private signTokens(accountId: string, email: string, role: string): Token {
    const accessToken = this.jwtService.sign(
      { id: accountId, email: email, role: role },
      { expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL') + 's' }, // Thời gian hết hạn cho access token
    );

    // const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    // console.log('Decoded:', decoded);
    // console.log('Token expiration time:', new Date(decoded.exp * 1000));
    // console.log('Current time:', new Date());

    const refreshToken = this.jwtService.sign(
      { id: accountId },
      { expiresIn: this.configService.get('JWT_REFRESH_TOKEN_TTL') + 's' }, // Thời gian hết hạn cho refresh token
    );

    return { accessToken, refreshToken };
  }

  private async validateAccount(
    email: string,
    password: string,
  ): Promise<Account | null> {
    const account = await this.prismaService.account.findUnique({
      where: { email, status: 'ACTIVE' },
    });
    if (account && (await argon2.verify(account.password, password))) {
      return account;
    }
    return null;
  }

  // Generate a random 2FA code
  private generate2FACode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code
  }

  private async checkTrustedDevice({
    account,
    userAgent,
  }: { account: Account } & { userAgent: string }): Promise<boolean> {
    const isTrustedDevice = account?.trustedDevice?.some((device) =>
      device.includes(userAgent),
    );

    if (!isTrustedDevice) return false;

    const now = new Date().getTime();
    const lastVerifiedAt = account.lastVerifiedAt?.getTime();

    // Kiểm tra xem thời gian xác thực cuối cùng có trong khoảng 1 tuần không
    const isWithinOneWeek = now - lastVerifiedAt < this.ONE_WEEK;

    return isWithinOneWeek;
  }
}
