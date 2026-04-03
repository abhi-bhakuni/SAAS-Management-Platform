import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { OrganizationStatus } from '../../../common/enums';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';

@Entity('organizations')
@Unique(['slug'])
@Index(['slug'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  industry: string;

  @Column({ type: 'integer', default: 1 })
  totalUsers: number;

  @Column({ type: 'varchar', length: 50, default: OrganizationStatus.ACTIVE })
  status: OrganizationStatus;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => UserOrganizationMembership,
    (membership) => membership.organization,
  )
  memberships: UserOrganizationMembership[];

  getSettings<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!this.settings) return defaultValue;
    return (this.settings[key] ?? defaultValue) as T | undefined;
  }

  setSetting(key: string, value: any): void {
    if (!this.settings) {
      this.settings = {};
    }
    this.settings[key] = value;
  }

  isActive(): boolean {
    return this.status === OrganizationStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.status === OrganizationStatus.SUSPENDED;
  }

  /**
   * @deprecated - Use UserOrganizationService.getOrgMembers() with role filter instead
   * This method requires eager loading of memberships which is not recommended
   */
  getAdmin(): UserOrganizationMembership | null | undefined {
    if (!this.memberships) return null;
    return this.memberships.find((m) => m.isAdmin() || m.isOwner());
  }
}
