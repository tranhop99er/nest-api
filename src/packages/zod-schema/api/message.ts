import { z } from 'zod';

// Định nghĩa schema cho Message với Zod
export const messageSchema = z.object({
  senderId: z.string().nonempty(), // senderId phải là chuỗi không rỗng
  receiverId: z.string().nonempty(), // receiverId phải là chuỗi không rỗng
  content: z.string().nonempty(), // content phải là chuỗi không rỗng
  roomId: z.string().optional(), // roomId có thể có hoặc không
});

export type messageSchema = z.infer<typeof messageSchema>;
