import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateSecret, generateURI, verify as verifyTOTP } from 'otplib';
import * as QRCode from 'qrcode';
import { UsersService } from '../../users/services/users.service';
import { LoginDto, SignupDto, AuthResponseDto } from '../dtos/index';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import { AuditLog } from '../../../common/entities/audit-log.entity';
import { OrganizationRole } from '../../../common/enums';
import { OrganizationsService } from '@/modules/organizations/services/organizations.service';
import { OrganizationInvitesService } from '@/modules/organizations/services/organization-invites.service';
import { EmailService } from '@/modules/email/services/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private organizationInvitesService: OrganizationInvitesService,
    private emailService: EmailService,
    @InjectRepository(UserOrganizationMembership)
    private membershipRepository: Repository<UserOrganizationMembership>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Register a new user (without org membership initially)
   * User will need to join an org via invite or admin assignment
   */
  async register(signupDto: SignupDto): Promise<AuthResponseDto> {
    if(signupDto.inviteToken) {
      try {
        // Find the invite by token
        const invite = await this.organizationInvitesService.getInvite(signupDto.inviteToken);

        if (!invite) {
          throw new BadRequestException('Invalid invite token');
        }

        if (invite.status !== 'PENDING') {
          throw new BadRequestException('Invite is no longer valid or has already been used');
        }

        if (signupDto.email.toLowerCase() !== invite.email.toLowerCase()) {
          throw new BadRequestException('Email does not match the invite');
        }

        // Create user via UsersService (WITHOUT organizationId)
        // Global role is always 'member' for invite-based signups; org-level role lives in the membership
        const user = await this.usersService.create({
          ...signupDto,
          email: invite.email, // Override email with the one from the invite to prevent abuse
          role: invite.role
        } as any);

        await this.auditLogRepository.save(
          this.auditLogRepository.create({
            userId: user.id,
            organizationId: invite.organizationId,
            action: 'CREATE',
            entityType: 'UserInvite',
            entityId: user.id,
            description: {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              organizationId: invite.organizationId,
              role: invite.role,
            },
          }),
        );

        // Create membership for the new user in the invited organization
        const membership = this.membershipRepository.create({
          userId: user.id,
          organizationId: invite.organizationId,
          role: invite.role,
        });
        await this.membershipRepository.save(membership);

        // Mark the invite as ACCEPTED now that the user has signed in
        await this.organizationInvitesService.markInviteAccepted(signupDto.inviteToken);

        // Generate token with the invited org as selectedOrgId
        const token = await this.generateToken(user, invite.organizationId);

        return {
          access_token: token,
          user: await this.formatUserResponse(user, [membership]),
          expiresIn: 86400, // 24 hours
        };
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        if ((error as any).code === '23505') {
          throw new ConflictException('Email already exists');
        }
        throw error;
      }
    } else {
      try {
        // Set default role if not provided
        if (!signupDto.role) {
          signupDto.role = 'admin' as any;
        }

        // Create organizaion of a new user
        const new_org = await this.organizationsService.create({
          name: `${signupDto.firstName}'s Workspace`,
          slug: `organization-workspace-${signupDto.firstName.toLowerCase()}`,
        });

        // Create user via UsersService (WITHOUT organizationId)
        const user = await this.usersService.create(signupDto as any);

        await this.auditLogRepository.save(
          this.auditLogRepository.create({
            userId: user.id,
            action: 'CREATE',
            entityType: 'User',
            entityId: user.id,
            description: { email: user.email, firstName: user.firstName, lastName: user.lastName },
          }),
        );

        // Create membership for the new user in the new organization
        const membership = this.membershipRepository.create({
          userId: user.id,
          organizationId: new_org.id,
          role: OrganizationRole.ADMIN,
        });
        await this.membershipRepository.save(membership);

        // Generate token with the new org as selectedOrgId
        const token = await this.generateToken(user, new_org.id);

        return {
          access_token: token,
          user: await this.formatUserResponse(user, [membership]),
          expiresIn: 86400, // 24 hours
        };
      } catch (error) {
        if ((error as any).code === '23505') {
          throw new ConflictException('Email already exists');
        }
        throw error;
      }
    }
  }

  /**
   * Login user with email and password
   * Returns token with first org membership as selectedOrgId
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.login(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user's org memberships
    const memberships = await this.membershipRepository.find({
      where: { userId: user.id },
      relations: ['organization'],
    });

    if (memberships.length === 0) {
      throw new ForbiddenException(
        'User must be a member of at least one organization. Contact an administrator.',
      );
    }

    // Use first membership as default selected org
    const selectedOrgId = memberships[0].organizationId;
    const token = await this.generateToken(user, selectedOrgId);

    return {
      access_token: token,
      user: await this.formatUserResponse(user, memberships),
      expiresIn: 86400, // 24 hours
    };
  }

  /**
   * Generate JWT token for a user with specific org context
   */
  async generateToken(user: any, selectedOrgId: string): Promise<string> {
    // Get membership for the selected org
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: user.id,
        organizationId: selectedOrgId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        `User is not a member of organization ${selectedOrgId}`,
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
      selectedOrgId: selectedOrgId,
      orgRole: membership.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Switch user's workspace context (get new token for different org)
   */
  async switchWorkspace(userId: string, targetOrgId: string): Promise<{ access_token: string; selectedOrgId: string; selectedOrgRole: OrganizationRole }> {
    // Verify user exists
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get membership for target org
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: targetOrgId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    // Generate new token for selected org
    const token = await this.generateToken(user, targetOrgId);

    return {
      access_token: token,
      selectedOrgId: targetOrgId,
      selectedOrgRole: membership.role,
    };
  }

  /**
   * Build a full auth response for an already provisioned user in a specific org context.
   */
  async createAuthResponseForOrg(user: any, selectedOrgId: string): Promise<AuthResponseDto> {
    const memberships = await this.membershipRepository.find({
      where: { userId: user.id },
      relations: ['organization'],
    });

    if (memberships.length === 0) {
      throw new ForbiddenException(
        'User must be a member of at least one organization. Contact an administrator.',
      );
    }

    const token = await this.generateToken(user, selectedOrgId);

    return {
      access_token: token,
      user: await this.formatUserResponse(user, memberships),
      expiresIn: 86400,
    };
  }

  /**
   * Format user data for response (exclude password)
   */
  async formatUserResponse(user: any, memberships: UserOrganizationMembership[] = []): Promise<any> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizations: memberships.map((m) => ({
        id: m.organizationId,
        name: m.organization?.name || 'Unknown',
        role: m.role,
      })),
      selectedOrgId: memberships[0]?.organizationId || null,
      selectedOrgRole: memberships[0]?.role || null,
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /** Change password for the current user */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    return this.usersService.changePassword(userId, { currentPassword, newPassword, confirmPassword: newPassword });
  }

  /** Return last 20 login events for the current user */
  async getLoginActivity(userId: string) {
    const logs = await this.auditLogRepository.find({
      where: { userId, action: 'LOGIN', entityType: 'User' },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return logs.map(l => ({
      id: l.id,
      ipAddress: l.ipAddress ?? 'Unknown',
      userAgent: l.userAgent ?? 'Unknown',
      createdAt: l.createdAt,
    }));
  }

  /** Generate a TOTP secret and return the QR code data URL */
  async generate2FA(userId: string): Promise<{ qrCodeUrl: string; secret: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      label: user.email,
      strategy: 'totp',
      issuer: 'SAASPlatform',
    });
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
    // Persist the unconfirmed secret temporarily
    await this.usersService.updateRaw(userId, { twoFactorSecret: secret });
    return { qrCodeUrl, secret };
  }

  /** Verify the TOTP code and enable 2FA */
  async enable2FA(userId: string, token: string): Promise<{ enabled: boolean }> {
    const user = await this.usersService.findOneWithSecret(userId);
    if (!user?.twoFactorSecret) throw new BadRequestException('Generate a 2FA secret first');
    const isValid = verifyTOTP({ token, secret: user.twoFactorSecret });
    if (!isValid) throw new BadRequestException('Invalid 2FA code');
    await this.usersService.updateRaw(userId, { twoFactorEnabled: true });
    return { enabled: true };
  }

  /** Disable 2FA after verifying a valid TOTP code */
  async disable2FA(userId: string, token: string): Promise<{ enabled: boolean }> {
    const user = await this.usersService.findOneWithSecret(userId);
    if (!user?.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');
    const isValid = verifyTOTP({ token, secret: user.twoFactorSecret! });
    if (!isValid) throw new BadRequestException('Invalid 2FA code');
    await this.usersService.updateRaw(userId, { twoFactorEnabled: false, twoFactorSecret: null });
    return { enabled: false };
  }

  /** Send a password-reset link to the user's email */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Silently ignore unknown emails

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await this.usersService.updateRaw(user.id, { passwordResetToken: token, passwordResetExpiry: expiry });

    const resetUrl = `${process.env.FRONTEND_URL}/auth?mode=reset&token=${token}`;
    try {
      await this.emailService.sendEmail(
        email,
        'reset-password',
        { firstName: user.firstName, resetUrl },
        'Reset your Nexus password',
      );
    } catch {
      // Email delivery failed — log the link so dev can test manually
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    }
  }

  /** Validate reset token and set the new password */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.passwordResetExpiry || new Date(user.passwordResetExpiry) < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    await this.usersService.updateRaw(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
  }

  /** Hard-delete the current organization and all its data (Danger Zone) */
  async closeOrganization(orgId: string) {
    await this.organizationsService.remove(orgId);
    return { message: 'Organization deleted successfully' };
  }

  /** Delete the requesting user's account. Blocks if they are the sole ADMIN of any org. */
  async deleteAccount(userId: string) {
    const memberships = await this.membershipRepository.find({ where: { userId } });

    // Check every org where this user is ADMIN
    for (const m of memberships) {
      if (m.role === OrganizationRole.ADMIN) {
        const otherAdmins = await this.membershipRepository.count({
          where: { organizationId: m.organizationId, role: OrganizationRole.ADMIN },
        });
        // otherAdmins includes the current user, so <=1 means sole admin
        if (otherAdmins <= 1) {
          throw new BadRequestException(
            'You are the only Admin of this organization. Promote another member to Admin before deleting your account.',
          );
        }
      }
    }

    // Remove all memberships
    if (memberships.length > 0) {
      await this.membershipRepository.remove(memberships);
    }

    // Deactivate user
    await this.usersService.updateRaw(userId, { isActive: false });
    return { message: 'Account deleted successfully' };
  }
}
