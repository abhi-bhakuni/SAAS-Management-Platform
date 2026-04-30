import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from '../services/chat.service';

const SUPPORT_EMAIL = 'support@nexus.com';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const { userId, userEmail } = client.handshake.query as Record<string, string>;
    if (!userId || !userEmail) { client.disconnect(); return; }

    if (userEmail === SUPPORT_EMAIL) {
      client.join('support');
      this.logger.log(`Support connected: ${client.id}`);
    } else {
      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string; senderType: 'USER' | 'SUPPORT'; senderName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, userEmail } = client.handshake.query as Record<string, string>;
    if (!userId || !userEmail) return;

    try {
      const msg = await this.chatService.saveMessage(
        data.conversationId,
        data.content,
        data.senderType,
        data.senderName,
        userId,
        userEmail,
      );

      const conv = await this.chatService.getConversationById(data.conversationId);
      if (!conv) return;

      const payload = { message: msg, conversation: conv };

      // Deliver to the user's room and the support room
      this.server.to(`user:${conv.userId}`).emit('new_message', payload);
      this.server.to('support').emit('new_message', payload);

      // Also push updated conversation list to support
      const conversations = await this.chatService.getAllConversations();
      this.server.to('support').emit('conversations_updated', { conversations });
    } catch (err: any) {
      client.emit('error', { message: err?.message ?? 'Failed to send message' });
    }
  }
}
