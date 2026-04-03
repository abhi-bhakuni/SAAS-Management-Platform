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

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'saas_management_db',
  entities: [
    User,
    Subscription,
    Organization,
    OrganizationInvite,
    AuditLog,
    UserOrganizationMembership,
    Project,
    Task,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true',
};

export const dataSource = new DataSource(dataSourceOptions);