import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity('user_organization_memberships')
@Index(['organizationId', 'role'])
@Index(['userId', 'organizationId'])
export class UserOrganizationMembership {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  organizationId: string;

  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.memberships, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 50 })
  role: OrganizationRole;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isOwner(): boolean {
    return this.role === OrganizationRole.OWNER;
  }

  isAdmin(): boolean {
    return this.role === OrganizationRole.ADMIN;
  }

  isMember(): boolean {
    return this.role === OrganizationRole.MEMBER;
  }

  canManageMembers(): boolean {
    return this.role === OrganizationRole.OWNER || this.role === OrganizationRole.ADMIN;
  }

  /**
   * Check if this membership role is higher or equal to another role
   * Hierarchy: OWNER > ADMIN > MEMBER
   */
  hasAtLeastRole(role: OrganizationRole): boolean {
    const hierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.ADMIN]: 2,
      [OrganizationRole.MEMBER]: 1,
    };
    return hierarchy[this.role] >= hierarchy[role];
  }
}
