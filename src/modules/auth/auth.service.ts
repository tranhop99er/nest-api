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

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}
  private readonly ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  async login(email: string, password: string): Promise<Token> {
    // Sử dụng phương thức validateAccount để tìm tài khoản
    const account = await this.validateAccount(email, password);

    // Kiểm tra tài khoản có tồn tại và mật khẩu có chính xác
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and save 2FA code (or you can save in a more secure way if needed)
    const twoFaCode = this.generate2FACode();

    // Store the 2FA code temporarily in the database or in memory for validation
    await this.prismaService.account.update({
      where: { id: account.id },
      data: { twoFaSecret: twoFaCode }, // Store temporarily (or use another mechanism)
    });

    // Send the 2FA code to the user's email using Handlebars template
    await this.mailerService.sendMail({
      to: account.email,
      subject: 'Your 2FA Code',
      template: 'confirm', // Name of your Handlebars template file (confirm.hbs)
      context: {
        role: account.role, // Pass user role to the template
        code: twoFaCode, // Send the generated 2FA code
      },
    });

    // Tạo access token và refresh token
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Cập nhật refresh token vào cơ sở dữ liệu nếu cần
    await this.prismaService.account.update({
      where: { id: account.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken }; // Trả về token
  }

  async verifyTwoFa(verify2FA: WithCurrentUser<IVerify2FA>): Promise<Token> {
    const { code } = verify2FA; // Lấy mã từ verify2FA
    const { currentUser } = verify2FA;

    const account = await this.prismaService.account.findUnique({
      where: { id: currentUser.id },
    });

    // Kiểm tra xem tài khoản có tồn tại và mã 2FA có đúng không
    if (!account || account.twoFaSecret !== code) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Xóa mã 2FA sau khi xác thực thành công
    await this.prismaService.account.update({
      where: { id: account.id },
      data: { twoFaSecret: null }, // Xóa mã 2FA sau khi xác thực
    });

    // Tạo access token và refresh token
    const { accessToken, refreshToken } = this.signTokens(
      account.id,
      account.email,
      account.role,
    );

    // Cập nhật refresh token vào cơ sở dữ liệu nếu cần
    await this.prismaService.account.update({
      where: { id: account.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken }; // Trả về token
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
    console.log(
      'JWT_ACCESS_TOKEN_TTL:',
      this.configService.get('JWT_ACCESS_TOKEN_TTL'),
    );
    const accessToken = this.jwtService.sign(
      { id: accountId, email: email, role: role },
      { expiresIn: this.configService.get('JWT_ACCESS_TOKEN_TTL') + 's' }, // Thời gian hết hạn cho access token
    );

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
}
