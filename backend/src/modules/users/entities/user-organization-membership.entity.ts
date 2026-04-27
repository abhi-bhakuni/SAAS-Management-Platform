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
import { OrganizationRole } from '../../../common/enums';

export { OrganizationRole };

@Entity('user_organization_memberships')
@Index(['organizationId', 'role'])
@Index(['userId', 'organizationId'])
export class UserOrganizationMembership {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('uuid')
  organizationId!: string;

  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Organization, (org) => org.memberships, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @Column({ type: 'varchar', length: 50 })
  role!: OrganizationRole;

  @CreateDateColumn()
  joinedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  isAdmin(): boolean {
    return this.role === OrganizationRole.ADMIN;
  }

  isManager(): boolean {
    return this.role === OrganizationRole.MANAGER;
  }

  isMember(): boolean {
    return this.role === OrganizationRole.MEMBER;
  }

  canManageMembers(): boolean {
    return this.role === OrganizationRole.ADMIN || this.role === OrganizationRole.MANAGER;
  }

  /**
   * Check if this membership role is higher or equal to another role
   * Hierarchy: ADMIN > MANAGER > MEMBER
   */
  hasAtLeastRole(role: OrganizationRole): boolean {
    const hierarchy = {
      [OrganizationRole.ADMIN]: 3,
      [OrganizationRole.MANAGER]: 2,
      [OrganizationRole.MEMBER]: 1,
    };
    return hierarchy[this.role] >= hierarchy[role];
  }
}
