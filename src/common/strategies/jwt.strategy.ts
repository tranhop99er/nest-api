// src/common/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../modules/prisma/prisma.service';
import { UserPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.cookies['accessToken'], // Lấy token từ cookie
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: UserPayload) {
    const user = await this.prisma.account.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user; // trả về user đã xác thực
  }
}
