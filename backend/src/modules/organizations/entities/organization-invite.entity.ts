import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../users/entities/user.entity';
import { OrganizationRole } from '../../../common/enums';

@Entity('organization_invites')
@Index(['email', 'organizationId'])
@Index(['inviteToken'])
@Index(['organizationId', 'status'])
@Unique(['inviteToken'])
export class OrganizationInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  inviteToken!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: OrganizationRole.MEMBER,
  })
  role!: OrganizationRole;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'PENDING',
  })
  status!: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

  @Column({ type: 'uuid', nullable: true })
  invitedByUserId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Check if the invite has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt && this.status === 'PENDING';
  }

  /**
   * Check if the invite can be accepted
   */
  canBeAccepted(): boolean {
    return this.status === 'PENDING' && !this.isExpired();
  }

  /**
   * Mark invite as expired
   */
  markAsExpired(): void {
    if (this.status === 'PENDING') {
      this.status = 'EXPIRED';
    }
  }

  /**
   * Accept the invite
   */
  accept(): void {
    if (this.canBeAccepted()) {
      this.status = 'ACCEPTED';
      this.acceptedAt = new Date();
    }
  }

  /**
   * Reject the invite
   */
  reject(): void {
    if (this.status === 'PENDING') {
      this.status = 'REJECTED';
    }
  }
}
