import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Account } from '@prisma/client';
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { Confirm2FaDto } from './dto';
import { ActiveUser, Public } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';
import { API_COMMON_MSG } from 'src/common/constants/default-message';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshTokenCookieName } =
      await this.authService.getCookiesNameFromRequest(request);
    const currentRefreshToken = request.cookies[refreshTokenCookieName];

    // Kiểm tra nếu refresh token hiện tại không có
    if (!currentRefreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Gọi phương thức refresh trong AuthService
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(currentRefreshToken);

    // Thiết lập cookie cho accessToken và refreshToken mới
    this.authService.setTokensInCookies(
      { accessToken, refreshToken },
      response,
    );

    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm-2fa')
  @HttpCode(HttpStatus.OK)
  async confirm2fa(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() confirm2faDto: Confirm2FaDto,
    @ActiveUser() currentUser: UserPayload,
  ) {
    if (!currentUser) {
      throw new BadRequestException(API_COMMON_MSG.userNotFound);
    }
    const userAgent = request.headers['user-agent'];
    console.log('User agent:', userAgent);

    const { accessToken, refreshToken } = await this.authService.verifyTwoFa({
      currentUser,
      code: confirm2faDto.code,
    });

    this.authService.setTokensInCookies(
      { accessToken, refreshToken },
      response,
    );

    return { message: '2FA confirmed successfully' };
  }

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string,
  ): Promise<Account> {
    return this.authService.register(email, username, password);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login(email, password);
    this.authService.setTokensInCookies(tokens, response);
    return { tokens };
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getCurrent(@ActiveUser('id') userId: string): Promise<UserPayload> {
    const user = await this.authService.getCurrentUser(userId);
    return user;
  }

  // @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Xóa cookie chứa token
    this.authService.clearCookie({ request, response });

    return { message: 'User logged out successfully' }; // Trả về thông báo thành công
  }
}
