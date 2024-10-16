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
import {
  UserCurrent,
  UserPayload,
} from 'src/common/strategies/jwt-payload.interface';
import { Confirm2FaDto } from './dto';
import { ActiveUser, Public } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('username') username: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(email, username, password);
    await this.authService.setTokensInCookies(result, response);
    return { message: result.message };
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
    const userAgent = request.headers['user-agent'];
    // Gọi hàm verifyTwoFa từ authService, truyền currentUser, code, và userAgent riêng biệt
    const { accessToken, refreshToken } = await this.authService.verifyTwoFa(
      { currentUser, code: confirm2faDto.code },
      userAgent,
    );

    // Set access token và refresh token vào cookies
    this.authService.setTokensInCookies(
      { accessToken, refreshToken },
      response,
    );

    return { message: '2FA confirmed successfully' };
  }

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

  @Post('login')
  async login(
    @Req() request: Request,
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userAgent = request.headers['user-agent'];
    const result = await this.authService.login(email, password, userAgent);

    this.authService.setTokensInCookies(result, response);
    return { message: result.message };
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getCurrent(@ActiveUser('id') userId: string): Promise<UserCurrent> {
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

    return { message: 'User logged out successfully' };
  }
}
