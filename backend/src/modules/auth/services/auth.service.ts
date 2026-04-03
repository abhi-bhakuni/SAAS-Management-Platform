import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import { LoginDto, SignupDto, AuthResponseDto, AuthUserDto } from '../dtos/index';
import { User } from '../../users/entities/user.entity';
import { UserOrganizationMembership, OrganizationRole } from '../../users/entities/user-organization-membership.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(UserOrganizationMembership)
    private membershipRepository: Repository<UserOrganizationMembership>,
  ) {}

  /**
   * Register a new user (without org membership initially)
   * User will need to join an org via invite or admin assignment
   */
  async register(signupDto: SignupDto): Promise<AuthResponseDto> {
    try {
      // Set default role if not provided
      if (!signupDto.role) {
        signupDto.role = 'member' as any;
      }

      // Create user via UsersService (WITHOUT organizationId)
      const user = await this.usersService.create(signupDto as any);

      // Since user has no org membership yet, we can't generate a token
      // Return user data but no token
      // Client should handle selecting an org before accessing protected routes
      return {
        access_token: '', // Empty token until user joins an org
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          // No selectedOrgId - user must join org first
        } as any,
        expiresIn: 0,
      };
    } catch (error) {
      if ((error as any).code === '23505') {
        throw new ConflictException('Email already exists');
      }
      throw error;
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
      role: user.role, // Global role
      selectedOrgId: selectedOrgId, // Current workspace
      orgRole: membership.role, // Role within selectedOrgId
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
}
