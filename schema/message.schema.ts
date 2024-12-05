import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

class File {
  @Prop({
    required: true,
  })
  id: string;
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  path: string;

  @Prop({
    required: true,
  })
  type: string;

  @Prop({
    required: true,
  })
  size: number;
}

@Schema()
export class Message extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  senderId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [File], default: [] })
  files: File[];

  @Prop({
    default: null,
  })
  readAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
