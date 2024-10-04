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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Account } from '@prisma/client';
import { Response } from 'express';
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { Confirm2FaDto } from './dto';
import { ActiveUser } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('confirm-2fa')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) // Đảm bảo guard được sử dụng
  async confirm2fa(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() confirm2faDto: Confirm2FaDto,
    @ActiveUser() currentUser: UserPayload,
  ) {
    // Kiểm tra currentUser có phải là undefined không
    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }
    const userAgent = request.headers['user-agent']; // Lấy thông tin user-agent từ request
    console.log('User agent:', userAgent); // In ra thông tin user-agent

    console.log('Current user:', currentUser); // In ra thông tin người dùng hiện tại
    const { accessToken, refreshToken } = await this.authService.verifyTwoFa({
      currentUser,
      code: confirm2faDto.code,
    });

    // Thiết lập cookie với accessToken và refreshToken bằng phương thức setTokensInCookies
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
}
