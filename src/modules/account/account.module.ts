import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { User, UserSchema } from 'schema/user.schema';
import { Conversation, ConversationSchema } from 'schema/conversation.schema';
import { Message, MessageSchema } from 'schema/message.schema';
import { PrismaModule } from 'src/common/modules/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, // PrismaModule để kết nối PostgreSQL
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema }, // Đăng ký Conversation Schema
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [AccountService], // Thêm gateway vào providers để xử lý socket
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}
