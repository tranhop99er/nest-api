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
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { IVerify2FA } from './interfaces';
import {
  mappingAccessTokenCookie,
  mappingRefreshTokenCookie,
  extractSiteKeyFromUrl,
} from 'src/common/utils';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'jsonwebtoken';
import { API_ERROR_MSG } from 'src/common/messages';
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

  async login(
    email: string,
    password: string,
    userAgent: string,
  ): Promise<Token & { message: string }> {
    // Sử dụng phương thức validateAccount để tìm tài khoản
    const account = await this.validateAccount(email, password);

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
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
        data: { twoFaSecret: twoFaCode }, // Store temporarily
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
    const { code } = verify2FA;
    const { currentUser } = verify2FA;

    const account = await this.prismaService.account.findUnique({
      where: { id: currentUser.id },
    });

    if (!account) {
      throw new BadRequestException(API_ERROR_MSG.userNotFound);
    }

    // Kiểm tra mã 2FA
    if (account.twoFaSecret !== code) {
      throw new BadRequestException(API_ERROR_MSG.invalidCode);
    }

    // Tạo access token và refresh token mới
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Cập nhật refresh token, lastVerifiedAt và trustedDevice vào cơ sở dữ liệu
    await this.prismaService.account.update({
      where: { id: account.id },
      data: {
        refreshToken,
        lastVerifiedAt: new Date(),
        trustedDevice: { push: userAgent },
      },
    });

    return { accessToken, refreshToken };
  }

  async register(email: string, username: string, password: string) {
    const hashedPassword = await argon2.hash(password);

    const account = await this.prismaService.account.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        user: {
          create: {},
        },
      },
      include: {
        user: true,
      },
    });

    return account;
  }

  async getCurrentUser(userId: string): Promise<UserPayload | null> {
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
