import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage, SenderType } from '../entities/chat-message.entity';

const SUPPORT_EMAIL = 'support@nexus.com';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async getOrCreateConversation(userId: string, userEmail: string, userName: string): Promise<ChatConversation> {
    let conv = await this.conversationRepo.findOne({ where: { userId } });
    if (!conv) {
      conv = this.conversationRepo.create({ userId, userEmail, userName });
      conv = await this.conversationRepo.save(conv);
    } else if (conv.userName !== userName) {
      conv.userName = userName;
      conv = await this.conversationRepo.save(conv);
    }
    return conv;
  }

  async getMessages(conversationId: string, limit = 50): Promise<ChatMessage[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    return this.conversationRepo.find({
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async saveMessage(
    conversationId: string,
    content: string,
    senderType: SenderType,
    senderName: string,
    requestingUserId: string,
    requestingUserEmail: string,
  ): Promise<ChatMessage> {
    const conv = await this.conversationRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');

    // Users can only write to their own conversation; support can write to any
    if (senderType === 'USER' && conv.userId !== requestingUserId) {
      throw new ForbiddenException('Cannot send to another user\'s conversation');
    }
    if (senderType === 'SUPPORT' && requestingUserEmail !== SUPPORT_EMAIL) {
      throw new ForbiddenException('Only support can send as support');
    }

    const msg = this.messageRepo.create({ conversationId, content, senderType, senderName });
    const saved = await this.messageRepo.save(msg);

    // Update conversation metadata
    conv.lastMessageAt = saved.createdAt;
    if (senderType === 'USER') conv.unreadBySupport += 1;
    else conv.unreadBySupport = 0;
    await this.conversationRepo.save(conv);

    return saved;
  }

  async resetUnread(conversationId: string): Promise<void> {
    await this.conversationRepo.update(conversationId, { unreadBySupport: 0 });
  }

  async getConversationById(id: string): Promise<ChatConversation | null> {
    return this.conversationRepo.findOne({ where: { id } });
  }
}
