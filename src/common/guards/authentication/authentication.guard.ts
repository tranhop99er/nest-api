import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['accessToken'];
    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      request.user = payload;
      return true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // const decoded = jwt.decode(token) as jwt.JwtPayload;
        // console.log('Decoded:', decoded);
        // console.log('Token expiration time:', new Date(decoded.exp * 1000));
        // console.log('Current time:', new Date());
        // console.error('Access token expired');
        throw new ForbiddenException('Token expired');
      }
      return false;
    }
  }
}
