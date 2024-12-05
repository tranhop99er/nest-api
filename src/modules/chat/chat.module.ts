import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService, ConfigService],
})
export class ChatModule {}
