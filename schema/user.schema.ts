import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '@prisma/client';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends Document {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: false,
    type: String,
  })
  accountId?: string;

  @Prop({
    required: true,
    enum: ['ADMIN', 'USER', 'ADMIN_CS', 'BOT'],
  })
  role: Role | 'BOT';

  @Prop({ default: Date.now })
  createdAt: Date; // Ngày tạo người dùng trong MongoDB
}

export const UserSchema = SchemaFactory.createForClass(User);
