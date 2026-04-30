import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators';
import { ChatService } from '../services/chat.service';

const SUPPORT_EMAIL = 'support@nexus.com';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Get (or create) the current user's conversation + message history */
  @Get('conversation')
  async getMyConversation(@CurrentUser() user: any) {
    const conv = await this.chatService.getOrCreateConversation(
      user.id,
      user.email,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    );
    const messages = await this.chatService.getMessages(conv.id);
    return { conversation: conv, messages };
  }

  /** List all conversations — support only */
  @Get('conversations')
  async getAllConversations(@CurrentUser() user: any) {
    if (user.email !== SUPPORT_EMAIL) {
      return { conversations: [] };
    }
    const conversations = await this.chatService.getAllConversations();
    return { conversations };
  }

  /** Get messages for a specific conversation */
  @Get('messages/:conversationId')
  async getMessages(@CurrentUser() user: any, @Param('conversationId') conversationId: string) {
    const conv = await this.chatService.getConversationById(conversationId);
    if (!conv) return { messages: [] };

    // Users can only read their own; support can read all
    if (user.email !== SUPPORT_EMAIL && conv.userId !== user.id) {
      return { messages: [] };
    }

    if (user.email === SUPPORT_EMAIL) {
      await this.chatService.resetUnread(conversationId);
    }

    const messages = await this.chatService.getMessages(conversationId);
    return { messages };
  }

  /** Ensure conversation exists and return id (called before opening chat widget) */
  @Post('conversation')
  async ensureConversation(@CurrentUser() user: any) {
    const conv = await this.chatService.getOrCreateConversation(
      user.id,
      user.email,
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    );
    return { conversationId: conv.id };
  }
}
