import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from 'schema/conversation.schema';
import { Message, MessageDocument } from 'schema/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  // 🟢 1️⃣ Tạo hoặc tìm cuộc trò chuyện 1-1
  async findOrCreateOneToOneConversation(userId1: string, userId2: string) {
    let conversation = await this.conversationModel.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
      isGroupChat: false,
    });

    if (!conversation) {
      conversation = new this.conversationModel({
        participants: [userId1, userId2],
        isGroupChat: false,
      });
      await conversation.save();
    }

    return conversation;
  }

  // 🟢 2️⃣ Tạo cuộc trò chuyện nhóm
  async createGroupChat(userIds: string[], name: string) {
    const conversation = new this.conversationModel({
      participants: userIds,
      isGroupChat: true,
      name,
    });
    return conversation.save();
  }

  // 🟢 3️⃣ Gửi tin nhắn trong 1-1 hoặc nhóm
  async sendMessage(conversationId: string, senderId: string, content: string) {
    const message = new this.messageModel({
      conversationId,
      senderId,
      content,
    });
    return message.save();
  }

  // 🟢 4️⃣ Gửi tin nhắn trong chat 1-1 (tự tìm hoặc tạo cuộc trò chuyện)
  async sendOneToOneMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    const conversation = await this.findOrCreateOneToOneConversation(
      senderId,
      receiverId,
    );
    return this.sendMessage(conversation._id.toString(), senderId, content);
  }

  // 🟢 5️⃣ Lấy tin nhắn theo cuộc trò chuyện
  async getMessages(conversationId: string) {
    return this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 })
      .exec();
  }

  // 🟢 6️⃣ Lấy danh sách cuộc trò chuyện của người dùng
  async getUserConversations(userId: string) {
    return this.conversationModel.find({ participants: userId }).exec();
  }
}
