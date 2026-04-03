import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../../../common/enums';

@Entity('task_status_histories')
@Index(['taskId', 'createdAt'])
@Index(['taskId'])
export class TaskStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'varchar', length: 50 })
  fromStatus: TaskStatus;

  @Column({ type: 'varchar', length: 50 })
  toStatus: TaskStatus;

  @Column({ type: 'uuid', nullable: true })
  changedByUserId: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'changedByUserId' })
  changedBy: User;
}
