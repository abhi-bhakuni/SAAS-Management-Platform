import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type SubscriptionPlanType = 'free' | 'pro';

@Entity('subscription_plans')
@Index(['type'])
@Index(['isActive'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: SubscriptionPlanType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'varchar', length: 50, default: 'monthly' })
  billingCycle: 'monthly' | 'annual';

  @Column({ type: 'varchar', nullable: true })
  stripePriceId: string;

  @Column({ type: 'json', nullable: true })
  features: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  limits: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  trialDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}