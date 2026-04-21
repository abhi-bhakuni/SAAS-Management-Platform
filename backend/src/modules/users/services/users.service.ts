import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  LoginDto,
  ChangePasswordDto,
} from '../dtos';
import { UserOrganizationMembership } from '../entities/user-organization-membership.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      data: users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, includePassword = false) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id });

    if (includePassword) {
      query.addSelect('user.password');
    }

    query.leftJoinAndSelect('user.memberships', 'memberships');
    query.leftJoinAndSelect('user.subscriptions', 'subscriptions');

    const user = await query.getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string, includePassword = false) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.password');
    }

    return query.getOne();
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepository.create(createUserDto);
    user.verificationToken = this.generateVerificationToken();

    const savedUser = await this.userRepository.save(user);

    // Create response without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.findOne(id, true);

    const isPasswordValid = await user.validatePassword(
      changePasswordDto.currentPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async login(loginDto: LoginDto) {
    const user = await this.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isAccountLocked()) {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      user.increaseLoginAttempts();
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    user.resetLoginAttempts();
    user.lastLoginAt = new Date().toISOString();
    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.verificationToken')
      .where('user.verificationToken = :token', { token })
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;

    await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByOrganization(organizationId: string) {
    // NOTE: This method should be replaced by UserOrganizationService
    // Keeping for backward compatibility but always returns empty array
    // Use UserOrganizationService.getOrgMembers() instead
    return [];
  }

  async countByOrganization(organizationId: string): Promise<number> {
    // NOTE: This method should be replaced by UserOrganizationService
    // Keeping for backward compatibility but always returns 0
    // Use UserOrganizationService.countOrgMembers() instead
    return 0;
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }
}
