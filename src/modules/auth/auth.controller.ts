import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Account } from '@prisma/client';
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { Confirm2FaDto } from './dto';
import { ActiveUser } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('confirm-2fa')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async confirm2fa(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() confirm2faDto: Confirm2FaDto,
    @ActiveUser() currentUser: UserPayload,
  ) {
    if (!currentUser) {
      throw new UnauthorizedException('User not found');
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

    return { message: '2FA confirmed successfully' }; // Trả về thông điệp xác nhận
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
    return { message: 'Login successful' };
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getCurrent(@ActiveUser('id') userId: string): Promise<UserPayload> {
    const user = await this.authService.getCurrentUser(userId);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Xóa cookie chứa token
    this.authService.clearCookie({ request, response });

    return { message: 'User logged out successfully' }; // Trả về thông báo thành công
  }
}
