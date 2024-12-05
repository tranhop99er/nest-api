import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Conversation extends Document {
  @Prop({
    type: [String],
    required: true,
  })
  participants: string[]; // Danh sách người tham gia cuộc trò chuyện (User)

  @Prop({
    type: Boolean,
    default: false,
  })
  isGroupChat: boolean; // Xác định cuộc trò chuyện là nhóm hay cá nhân

  @Prop({
    type: String,
    default: '',
  })
  name: string; // Tên cuộc trò chuyện

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date; // Thời gian tạo cuộc trò chuyện
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
