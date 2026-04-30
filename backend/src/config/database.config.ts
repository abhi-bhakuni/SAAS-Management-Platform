import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/entities/user.entity';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationInvite } from '../modules/organizations/entities/organization-invite.entity';
import { AuditLog } from '../common/entities/audit-log.entity';
import { UserOrganizationMembership } from '../modules/users/entities/user-organization-membership.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { Task } from '../modules/projects/entities/task.entity';
import { TaskStatusHistory } from '../modules/projects/entities/task-status-history.entity';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';
import { ChatConversation } from '../modules/chat/entities/chat-conversation.entity';
import { ChatMessage } from '../modules/chat/entities/chat-message.entity';
import { TypeOrmCustomLogger } from '@/common/loggers/typeorm-logger';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'abhishekbhakuni',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'saas_management_db',
  entities: [
    User,
    Subscription,
    SubscriptionPlan,
    Organization,
    OrganizationInvite,
    AuditLog,
    UserOrganizationMembership,
    Project,
    Task,
    TaskStatusHistory,
    ChatConversation,
    ChatMessage,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: ['query', 'error', 'warn'],
  logger: new TypeOrmCustomLogger(),
  ssl: process.env.DATABASE_SSL === 'true',
};

export const dataSource = new DataSource(dataSourceOptions);