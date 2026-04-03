import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectStatus } from '../../../common/enums';

@Entity('projects')
@Index(['organizationId'])
@Index(['organizationId', 'status'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  // Helper methods
  isActive(): boolean {
    return this.status === ProjectStatus.ACTIVE;
  }

  isArchived(): boolean {
    return this.status === ProjectStatus.ARCHIVED;
  }

  isCompleted(): boolean {
    return this.status === ProjectStatus.COMPLETED;
  }
}
