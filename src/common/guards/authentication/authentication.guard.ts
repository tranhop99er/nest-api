import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // Bỏ qua xác thực nếu route là public
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['accessToken'];
    if (!token) {
      throw new ForbiddenException('Token undefined');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;

      // const decoded = jwt.decode(token) as jwt.JwtPayload;
      // console.log('Decoded:', decoded);
      // console.log('Token expiration time:', new Date(decoded.exp * 1000));
      // console.log('Current time:', new Date());
      // console.error('Access token expired');
      return true;
    } catch (err) {
      console.error(err);
      throw new ForbiddenException('Token expired');
    }
  }
}
