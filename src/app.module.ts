import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailerConfigModule } from './config/modules/mailerConfig.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthorizationGuard } from './common/guards/authorization/authorization.guard';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [PrismaModule, AuthModule, MailerConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*'); // Áp dụng cookieParser cho tất cả các route
  }
}
