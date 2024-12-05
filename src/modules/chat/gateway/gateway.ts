import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';

@WebSocketGateway({ cors: true }) // Cho phép CORS để client có thể kết nối
export class ChatGateway {
  @WebSocketServer()
  server: Server; // Socket.io Server

  constructor(private readonly chatService: ChatService) {}

  // ✅ 1️⃣ User kết nối WebSocket
  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`🔵 Client connected: ${client.id}`);
  }

  // ✅ 2️⃣ User rời kết nối WebSocket
  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`🔴 Client disconnected: ${client.id}`);
  }

  // ✅ 3️⃣ User join vào room (khi mở cuộc trò chuyện)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(data.conversationId); // Join vào room dựa trên conversationId
    console.log(`✅ User ${client.id} joined room ${data.conversationId}`);
  }

  // ✅ 4️⃣ User gửi tin nhắn (tự động tạo room nếu chưa có)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userIds: string[];
      senderId: string;
      content: string;
    },
  ) {
    const message = await this.chatService.sendOneToOneMessage(
      data.userIds[0],
      data.senderId,
      data.content,
    );

    // 📢 Gửi tin nhắn đến room tương ứng
    this.server
      .to(message.conversationId.toString())
      .emit('newMessage', message);

    return message;
  }

  // ✅ 5️⃣ Lấy danh sách tin nhắn
  @SubscribeMessage('getMessages')
  async handleGetMessages(@MessageBody() data: { conversationId: string }) {
    return this.chatService.getMessages(data.conversationId);
  }
}
