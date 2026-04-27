import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { OrganizationInvite } from '../entities/organization-invite.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { UserOrganizationService } from './user-organization.service';
import { EmailService } from '../../email/services/email.service';
import {
  CreateInviteDto,
  InviteResponseDto,
  AcceptInviteDto,
  ListInvitesDto,
} from '../dtos';
import { plainToClass } from 'class-transformer';

@Injectable()
export class OrganizationInvitesService {
  private readonly logger = new Logger(OrganizationInvitesService.name);

  constructor(
    @InjectRepository(OrganizationInvite)
    private readonly inviteRepository: Repository<OrganizationInvite>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly userOrgService: UserOrganizationService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new organization invite
   */
  async createInvite(
    organizationId: string,
    createInviteDto: CreateInviteDto,
    invitedByUserId: string,
  ): Promise<InviteResponseDto> {
    // Verify organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    // Check if user already exists in this specific organization
    const existingUser = await this.usersService.findByEmail(createInviteDto.email);
    if (existingUser) {
      // User exists globally - check if already member of this org
      const existingMembership = await this.userOrgService.isUserMemberOfOrg(
        existingUser.id,
        organizationId,
      );
      if (existingMembership) {
        throw new ConflictException(
          `User ${createInviteDto.email} is already a member of this organization`,
        );
      }
      // User exists but not member of this org - can invite them
    }

    // Check if pending invite already exists
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        email: createInviteDto.email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        `Invite already exists for ${createInviteDto.email}`,
      );
    }

    // Generate unique invite token
    const inviteToken = this.generateInviteToken();

    // Calculate expiration (14 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Get inviter user details
    const inviter = await this.userRepository.findOne({
      where: { id: invitedByUserId },
    });

    // Create and save invite
    const invite = this.inviteRepository.create({
      organizationId,
      email: createInviteDto.email,
      inviteToken,
      role: createInviteDto.role,
      status: 'PENDING',
      expiresAt,
      invitedByUserId,
    });

    const savedInvite = await this.inviteRepository.save(invite);

    // Send invite email
    try {
      await this.emailService.sendInviteEmail(
        createInviteDto.email,
        inviteToken,
        organization.name,
        inviter?.getFullName() || 'An admin',
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send invite email to ${createInviteDto.email}`,
      );
    }

    this.logger.log(
      `Invite created for ${createInviteDto.email} to ${organization.name}`,
    );

    return this.mapToResponseDto(savedInvite, inviter || undefined);
  }

  /**
   * List invites for an organization
   */
  async listInvites(
    organizationId: string,
    filter?: ListInvitesDto,
  ): Promise<{
    data: InviteResponseDto[];
    _metadata: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    }
  }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;

    const query = this.inviteRepository
      .createQueryBuilder('invite')
      .where('invite.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('invite.invitedBy', 'invitedBy');

    if (filter?.status) {
      query.andWhere('invite.status = :status', { status: filter.status });
    }

    const [invites, total] = await query
      .orderBy('invite.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = invites.map((invite) =>
      this.mapToResponseDto(invite, invite.invitedBy),
    );

    return {
      data,
      _metadata: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get invite by ID
   */
  async getInvite(inviteId: string) {
    const invite = await this.inviteRepository.findOne({
      where: {
        inviteToken: inviteId,
      },
      relations: ['invitedBy'],
    });

    if (!invite) {
      throw new BadRequestException('Invite not found');
    }

    return this.mapToResponseDto(invite, invite.invitedBy);
  }

  /**
   * Accept an invite by token and link/create user
   * If user exists: adds membership; if not: creates user then adds membership
   */
  async acceptInvite(
    token: string,
    acceptInviteDto: AcceptInviteDto,
  ): Promise<{ user: any; invite: InviteResponseDto }> {
    // Find invite by token
    const invite = await this.getInviteByToken(token);

    if (!invite.canBeAccepted()) {
      if (invite.status === 'ACCEPTED') {
        throw new ConflictException('This invite has already been accepted');
      }
      if (invite.status === 'REJECTED') {
        throw new BadRequestException('This invite has been rejected');
      }
      if (invite.isExpired()) {
        throw new BadRequestException('This invite has expired');
      }
    }

    // Check if user with email already exists
    let user = await this.usersService.findByEmail(invite.email);

    if (!user) {
      // Create user account only. Workspace linkage is handled exclusively via memberships.
      const createUserDto: any = {
        email: invite.email,
        firstName: acceptInviteDto.firstName,
        lastName: acceptInviteDto.lastName,
        password: acceptInviteDto.password,
        role: 'member', // Default to member role
      };
      delete createUserDto.organizationId;

      try {
        user = await this.usersService.create(createUserDto) as any;
      } catch (error) {
        if (error instanceof ConflictException) {
          throw new ConflictException('Email already in use');
        }
        throw error;
      }

      this.logger.log(`New user created: ${invite.email}`);
    } else {
      // Existing user accepts invite - they'll get added to new org
      this.logger.log(`Existing user ${invite.email} accepting invite to new org`);
    }

    if (!user || !user.id) {
      throw new BadRequestException('Failed to create or retrieve user');
    }

    // Add user to organization via membership

    try {
      await this.userOrgService.addUserToOrganization(
        user.id,
        invite.organizationId,
        invite.role,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(
          'User is already a member of this organization',
        );
      }
      throw error;
    }

    // Mark invite as accepted
    invite.accept();
    const updatedInvite = await this.inviteRepository.save(invite);

    // Send acceptance confirmation email
    try {
      const organization = await this.organizationRepository.findOne({
        where: { id: invite.organizationId },
      });
      await this.emailService.sendAcceptanceConfirmation(
        invite.email,
        organization?.name || 'our platform',
      );
    } catch (error) {
      this.logger.warn(`Failed to send confirmation email`);
    }

    this.logger.log(`Invite ${invite.id} accepted by ${invite.email}`);

    return {
      user,
      invite: this.mapToResponseDto(updatedInvite),
    };
  }

  /**
   * Revoke (reject) an invite
   */
  async revokeInvite(
    inviteId: string,
    organizationId: string,
  ): Promise<InviteResponseDto> {
    const invite = await this.inviteRepository.findOne({
      where: {
        id: inviteId,
        organizationId,
      },
      relations: ['invitedBy'],
    });

    if (!invite) {
      throw new NotFoundException(`Invite ${inviteId} not found`);
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot revoke invite with status ${invite.status}`,
      );
    }

    invite.reject();
    const updatedInvite = await this.inviteRepository.save(invite);

    this.logger.log(`Invite ${inviteId} revoked`);

    return this.mapToResponseDto(updatedInvite, invite.invitedBy);
  }

  /**
   * Resend an invite email
   */
  async resendInvite(
    inviteId: string,
    organizationId: string,
  ): Promise<InviteResponseDto> {
    const invite = await this.inviteRepository.findOne({
      where: {
        id: inviteId,
        organizationId,
      },
      relations: ['invitedBy', 'organization'],
    });

    if (!invite) {
      throw new NotFoundException(`Invite not found`);
    }

    if (invite.status !== 'PENDING' && invite.status !== 'EXPIRED') {
      throw new BadRequestException(
        `Cannot resend invite with status ${invite.status}`,
      );
    }

    // Reset expiration to 14 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);
    invite.expiresAt = expiresAt;

    // Reset status to PENDING if was EXPIRED
    if (invite.status === 'EXPIRED') {
      invite.status = 'PENDING';
    }

    const updatedInvite = await this.inviteRepository.save(invite);

    // Resend invite email
    try {
      await this.emailService.sendInviteEmail(
        invite.email,
        invite.inviteToken,
        invite.organization?.name || 'our platform',
        invite.invitedBy?.getFullName() || 'An admin',
      );
    } catch (error) {
      this.logger.warn(`Failed to resend invite email`);
    }

    this.logger.log(`Invite ${inviteId} resent to ${invite.email}`);

    return this.mapToResponseDto(updatedInvite, invite.invitedBy);
  }

  /**
   * Mark invite as ACCEPTED after the invited user successfully signs in
   */
  async markInviteAccepted(inviteToken: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { inviteToken },
    });
    if (invite && invite.status === 'PENDING') {
      invite.accept();
      await this.inviteRepository.save(invite);
    }
  }

  /**
   * Get invite by token (private helper)
   */
  private async getInviteByToken(token: string): Promise<OrganizationInvite> {
    const invite = await this.inviteRepository.findOne({
      where: { inviteToken: token },
      relations: ['organization', 'invitedBy'],
    });

    if (!invite) {
      throw new NotFoundException('Invalid invite token');
    }

    return invite;
  }

  /**
   * Expire old pending invites (14+ days)
   * Should be run as a scheduled task
   */
  async expireOldInvites(): Promise<number> {
    const now = new Date();
    const result = await this.inviteRepository
      .createQueryBuilder('invite')
      .update(OrganizationInvite)
      .set({ status: 'EXPIRED' })
      .where('invite.status = :status', { status: 'PENDING' })
      .andWhere('invite.expiresAt < :now', { now })
      .execute();

    const expiredCount = result.affected || 0;
    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} old invites`);
    }

    return expiredCount;
  }

  /**
   * Generate unique invite token
   */
  private generateInviteToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(
    invite: OrganizationInvite,
    invitedBy?: User,
  ): InviteResponseDto {
    return plainToClass(InviteResponseDto, {
      id: invite.id,
      organizationId: invite.organizationId,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
      invitedBy: invitedBy,
    });
  }
}
