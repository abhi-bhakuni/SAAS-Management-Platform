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
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskStatus, TaskPriority } from '../../../common/enums';

@Entity('tasks')
@Index(['projectId'])
@Index(['projectId', 'status'])
@Index(['assignedToUserId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 50, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  // Helper methods
  isCompleted(): boolean {
    return this.status === TaskStatus.DONE;
  }

  isInProgress(): boolean {
    return this.status === TaskStatus.IN_PROGRESS;
  }

  isPending(): boolean {
    return this.status === TaskStatus.TODO;
  }

  isOverdue(): boolean {
    if (!this.dueDate || this.isCompleted()) return false;
    return new Date() > this.dueDate;
  }
}
