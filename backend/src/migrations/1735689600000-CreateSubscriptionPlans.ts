import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSubscriptionPlans1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_plans table
    await queryRunner.createTable(
      new Table({
        name: 'subscription_plans',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['free', 'pro', 'enterprise'],
            enumName: 'subscription_plan_type_enum',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'usd'",
            isNullable: false,
          },
          {
            name: 'billing_interval',
            type: 'enum',
            enum: ['month', 'year'],
            enumName: 'billing_interval_enum',
            isNullable: false,
          },
          {
            name: 'stripe_price_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'limits',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'trial_days',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'subscription_plans',
      new TableIndex({
        name: 'IDX_subscription_plans_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'subscription_plans',
      new TableIndex({
        name: 'IDX_subscription_plans_active',
        columnNames: ['is_active'],
      }),
    );

    // Update subscriptions table to use new structure
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD COLUMN subscription_plan_id uuid,
      ADD COLUMN stripe_customer_id varchar(100),
      ADD COLUMN stripe_subscription_id varchar(100),
      ADD COLUMN current_period_start timestamp,
      ADD COLUMN current_period_end timestamp,
      ADD COLUMN trial_start timestamp,
      ADD COLUMN trial_end timestamp,
      ADD COLUMN cancel_at_period_end boolean DEFAULT false,
      ADD COLUMN canceled_at timestamp
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT FK_subscriptions_subscription_plan
      FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
    `);

    // Update status enum to match new SubscriptionStatus
    await queryRunner.query(`
      ALTER TYPE subscriptions_status_enum RENAME TO subscriptions_status_enum_old;
      CREATE TYPE subscriptions_status_enum AS ENUM('active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing');
      ALTER TABLE subscriptions ALTER COLUMN status TYPE subscriptions_status_enum USING
        CASE
          WHEN status::text = 'active' THEN 'active'::subscriptions_status_enum
          WHEN status::text = 'cancelled' THEN 'canceled'::subscriptions_status_enum
          WHEN status::text = 'suspended' THEN 'past_due'::subscriptions_status_enum
          WHEN status::text = 'trial' THEN 'trialing'::subscriptions_status_enum
          ELSE 'incomplete'::subscriptions_status_enum
        END;
      DROP TYPE subscriptions_status_enum_old;
    `);

    // Rename created_at and updated_at columns to match new naming
    await queryRunner.query(`
      ALTER TABLE subscriptions RENAME COLUMN createdAt TO created_at;
      ALTER TABLE subscriptions RENAME COLUMN updatedAt TO updated_at;
    `);

    // Create indexes for subscriptions table
    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_stripe_subscription_id',
        columnNames: ['stripe_subscription_id'],
      }),
    );

    await queryRunner.createIndex(
      'subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_status');
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_stripe_subscription_id');
    await queryRunner.dropIndex('subscriptions', 'IDX_subscriptions_user_id');
    await queryRunner.dropIndex('subscription_plans', 'IDX_subscription_plans_active');
    await queryRunner.dropIndex('subscription_plans', 'IDX_subscription_plans_type');

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE subscriptions DROP CONSTRAINT FK_subscriptions_subscription_plan
    `);

    // Remove added columns from subscriptions
    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP COLUMN subscription_plan_id,
      DROP COLUMN stripe_customer_id,
      DROP COLUMN stripe_subscription_id,
      DROP COLUMN current_period_start,
      DROP COLUMN current_period_end,
      DROP COLUMN trial_start,
      DROP COLUMN trial_end,
      DROP COLUMN cancel_at_period_end,
      DROP COLUMN canceled_at
    `);

    // Revert status enum
    await queryRunner.query(`
      ALTER TYPE subscriptions_status_enum RENAME TO subscriptions_status_enum_new;
      CREATE TYPE subscriptions_status_enum AS ENUM('active', 'cancelled', 'suspended', 'trial', 'past_due');
      ALTER TABLE subscriptions ALTER COLUMN status TYPE subscriptions_status_enum USING
        CASE
          WHEN status::text = 'active' THEN 'active'::subscriptions_status_enum
          WHEN status::text = 'canceled' THEN 'cancelled'::subscriptions_status_enum
          WHEN status::text = 'past_due' THEN 'suspended'::subscriptions_status_enum
          WHEN status::text = 'trialing' THEN 'trial'::subscriptions_status_enum
          ELSE 'active'::subscriptions_status_enum
        END;
      DROP TYPE subscriptions_status_enum_new;
    `);

    // Rename columns back
    await queryRunner.query(`
      ALTER TABLE subscriptions RENAME COLUMN created_at TO createdAt;
      ALTER TABLE subscriptions RENAME COLUMN updated_at TO updatedAt;
    `);

    // Drop subscription_plans table
    await queryRunner.dropTable('subscription_plans');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS billing_interval_enum');
    await queryRunner.query('DROP TYPE IF EXISTS subscription_plan_type_enum');
  }
}