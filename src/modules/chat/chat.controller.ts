import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create-conversation')
  async createConversation(
    @Body() body: { userIds: string[]; isGroupChat?: boolean; name?: string },
  ) {
    return this.chatService.createGroupChat(body.userIds, body.name);
  }

  @Post('send-message')
  async sendMessage(
    @Body() body: { conversationId: string; senderId: string; content: string },
  ) {
    return this.chatService.sendMessage(
      body.conversationId,
      body.senderId,
      body.content,
    );
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }
}
