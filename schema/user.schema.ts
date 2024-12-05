import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// Enum role định nghĩa lại để dùng trong Mongoose
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  ADMIN_CS = 'ADMIN_CS',
  BOT = 'BOT',
}

@Schema({ timestamps: true }) // Sử dụng timestamps để tự động thêm createdAt, updatedAt
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  accountId?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, enum: UserRole }) // Dùng enum riêng
  role: UserRole;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
