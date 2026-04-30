import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { AuditLog } from '../../../common/entities/audit-log.entity';
import { OrganizationRole } from '../../../common/enums';
import { UserOrganizationMembership } from './user-organization-membership.entity';

@Entity('users')
@Unique(['email'])
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password?: string;

  @Column({ type: 'varchar', length: 50, default: OrganizationRole.MEMBER })
  role!: OrganizationRole;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  verificationToken?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  lastLoginAt!: string;

  @Column({ type: 'integer', default: 0 })
  loginAttempts!: number;

  @Column({ type: 'varchar', nullable: true })
  lockUntil?: string;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true, select: false })
  twoFactorSecret?: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordResetToken?: string;

  @Column({ type: 'varchar', nullable: true })
  passwordResetExpiry?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(
    () => UserOrganizationMembership,
    (membership) => membership.user,
  )
  memberships!: UserOrganizationMembership[];

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions!: Subscription[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  getFullName(): string {
    return `${this.firstName}${this.lastName ? ' ' + this.lastName : ''}`;
  }

  isAccountLocked(): boolean {
    if (!this.lockUntil) return false;
    return new Date(this.lockUntil) > new Date();
  }

  increaseLoginAttempts(): void {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
  }

  /**
   * Get all organizations this user is a member of
   */
  getOrganizations() {
    return this.memberships?.map((m) => ({
      id: m.organizationId,
      role: m.role,
    })) || [];
  }
}
