-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for subscription plans
CREATE TYPE subscription_plan_type_enum AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE billing_interval_enum AS ENUM ('month', 'year');

-- Organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  description text,
  website varchar,
  logoUrl varchar,
  industry varchar(20),
  totalUsers integer DEFAULT 1,
  status varchar(50) DEFAULT 'active',
  settings json,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON organizations (slug);

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) UNIQUE NOT NULL,
  firstName varchar(255) NOT NULL,
  lastName varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'member',
  emailVerified boolean DEFAULT false,
  verificationToken varchar,
  isActive boolean DEFAULT true,
  lastLoginAt varchar,
  loginAttempts integer DEFAULT 0,
  lockUntil varchar,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON users (email);

ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('admin', 'manager', 'member'));

-- User Organization Memberships table
CREATE TABLE user_organization_memberships (
  userId uuid NOT NULL,
  organizationId uuid NOT NULL,
  role varchar(50) DEFAULT 'MEMBER',
  joinedAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, organizationId)
);

ALTER TABLE user_organization_memberships ADD CONSTRAINT fk_uom_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_organization_memberships ADD CONSTRAINT fk_uom_orgId FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX ON user_organization_memberships (organizationId, role);
CREATE INDEX ON user_organization_memberships (userId, organizationId);

-- Organization Invites table
CREATE TABLE organization_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId uuid NOT NULL,
  email varchar(255) NOT NULL,
  inviteToken varchar(255) UNIQUE NOT NULL,
  role varchar(50) DEFAULT 'member',
  status varchar(50) DEFAULT 'PENDING',
  invitedByUserId uuid,
  acceptedAt timestamp,
  expiresAt timestamp NOT NULL,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE organization_invites ADD CONSTRAINT fk_org_invites_orgId FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE organization_invites ADD CONSTRAINT fk_org_invites_userId FOREIGN KEY (invitedByUserId) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX ON organization_invites (email, organizationId);
CREATE INDEX ON organization_invites (inviteToken);
CREATE INDEX ON organization_invites (organizationId, status);
CREATE INDEX ON organization_invites (status);

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId uuid NOT NULL,
  createdByUserId uuid,
  name varchar(255) NOT NULL,
  description text,
  status varchar(50) DEFAULT 'active',
  settings json,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON projects (organizationId);
CREATE INDEX ON projects (status);
CREATE INDEX ON projects (organizationId, status);

ALTER TABLE projects ADD CONSTRAINT fk_projects_orgId FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_userId FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL;

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  projectId uuid NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  dueDate date,
  status varchar(50) DEFAULT 'todo',
  priority varchar(20) DEFAULT 'medium',
  assignedToUserId uuid,
  createdByUserId uuid,
  metadata json,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON tasks (projectId);
CREATE INDEX ON tasks (projectId, status);
CREATE INDEX ON tasks (assignedToUserId);

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_projectId FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assignedTo FOREIGN KEY (assignedToUserId) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_createdBy FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL;

-- Subscription Plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  description text,
  type subscription_plan_type_enum NOT NULL,
  price decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'usd' NOT NULL,
  billing_interval billing_interval_enum NOT NULL,
  stripe_price_id varchar(100),
  features jsonb,
  limits jsonb,
  is_active boolean DEFAULT true NOT NULL,
  trial_days integer DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX ON subscription_plans (type);
CREATE INDEX ON subscription_plans (is_active);

-- Subscriptions table (updated structure)
CREATE TYPE subscriptions_status_enum AS ENUM('active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'trialing');

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL,
  organizationId uuid NOT NULL,
  subscription_plan_id uuid,
  planName varchar(100) NOT NULL,
  status subscriptions_status_enum DEFAULT 'active',
  price decimal(10,2) NOT NULL,
  billingCycle varchar(50) DEFAULT 'monthly',
  stripeSubscriptionId varchar(100),
  stripeCustomerId varchar(100),
  startDate date NOT NULL,
  endDate date,
  nextBillingDate date,
  cancelledAt date,
  maxUsers integer DEFAULT 0,
  autoRenew boolean DEFAULT false,
  current_period_start timestamp,
  current_period_end timestamp,
  trial_start timestamp,
  trial_end timestamp,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_orgId FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;

CREATE INDEX ON subscriptions (userId);
CREATE INDEX ON subscriptions (organizationId);
CREATE INDEX ON subscriptions (status);
CREATE INDEX ON subscriptions (stripeSubscriptionId);

-- Audit Logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId uuid,
  action varchar(50) NOT NULL,
  entityType varchar(100) NOT NULL,
  entityId uuid NOT NULL,
  changes json,
  ipAddress varchar,
  userAgent varchar,
  createdAt timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON audit_logs (userId);
CREATE INDEX ON audit_logs (entityType);
CREATE INDEX ON audit_logs (action);
CREATE INDEX ON audit_logs (createdAt);

ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL;

-- Chat Conversations table
-- \d chat_conversations
--  Column            | Type                        | Nullable | Default
--  id                | uuid                        | not null | uuid_generate_v4()
--  userId            | character varying(255)      | not null |
--  userEmail         | character varying(255)      | not null |
--  userName          | character varying(255)      | not null |
--  last_message_at   | timestamp without time zone |          |
--  unread_by_support | integer                     | not null | 0
--  created_at        | timestamp without time zone | not null | now()
--  updated_at        | timestamp without time zone | not null | now()

CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" varchar(255) NOT NULL,
  "userEmail" varchar(255) NOT NULL,
  "userName" varchar(255) NOT NULL,
  last_message_at timestamp,
  unread_by_support integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON chat_conversations ("userId");
CREATE INDEX ON chat_conversations (last_message_at);

-- Chat Messages table
-- \d chat_messages
--  Column          | Type                        | Nullable | Default
--  id              | uuid                        | not null | uuid_generate_v4()
--  conversation_id | uuid                        | not null |
--  content         | text                        | not null |
--  sender_type     | character varying(20)       | not null |
--  sender_name     | character varying(255)      | not null |
--  created_at      | timestamp without time zone | not null | now()

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  content text NOT NULL,
  sender_type varchar(20) NOT NULL,
  sender_name varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON chat_messages (conversation_id);
CREATE INDEX ON chat_messages (created_at);

ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;