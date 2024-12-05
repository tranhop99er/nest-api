import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    required: true,
  })
  participants: MongooseSchema.Types.ObjectId[];

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
export type ConversationDocument = Conversation & Document;
