import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/modules/prisma/prisma.module';
import { MailerConfigModule } from './config/modules/mailerConfig.module';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AuthorizationGuard } from './common/guards/authorization/authorization.guard';
import * as cookieParser from 'cookie-parser';
import { SystemModule } from './modules/system/system.module';
import { UserModule } from './modules/user/user.module';
import { JwtAuthGuard } from './common/guards/authentication/authentication.guard';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from './config/environment';

@Module({
  imports: [
    //JwtService is a provider, is it part of the current AppModule
    {
      ...JwtModule.registerAsync(jwtConfig.asProvider()),
      global: true,
    },
    PrismaModule,
    MailerConfigModule,
    SystemModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
