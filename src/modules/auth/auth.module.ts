// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_TTL
          ? process.env.JWT_ACCESS_TOKEN_TTL + 's'
          : '3600s',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    ConfigService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
