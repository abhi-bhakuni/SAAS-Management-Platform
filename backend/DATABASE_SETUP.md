# PostgreSQL & TypeORM Setup Guide

## Overview

This backend uses **TypeORM** as the ORM layer and **PostgreSQL** as the database. The architecture includes:
- Entity-based database schema
- Automigration and version control
- Database seeding for development
- Comprehensive entity relationships

## Database Schema

### Tables & Relationships

```
Organizations (1) ──────┬──────── (Many) Users
                        └──────── (Many) Subscriptions
                        
Users (1) ─────────────────────── (Many) Subscriptions
      (1) ─────────────────────── (Many) AuditLogs

AuditLog (Many) ───────────────── (1) User
```

### Entities

#### 1. **Organization**
- `id` (UUID): Primary key
- `name` (varchar): Organization name
- `slug` (varchar, unique): URL-friendly identifier
- `description` (text): Organization description
- `website` (varchar): Company website
- `logoUrl` (varchar): Logo URL
- `industry` (varchar): Industry type
- `totalUsers` (integer): Total user count
- `status` (varchar): active | inactive | suspended
- `settings` (json): Configuration settings
- `createdAt`, `updatedAt` (timestamps)

#### 2. **User**
- `id` (UUID): Primary key
- `email` (varchar, unique): User email
- `firstName`, `lastName` (varchar): Name fields
- `password` (varchar): Hashed password
- `role` (varchar): admin | user | viewer
- `emailVerified` (boolean): Email verification status
- `isActive` (boolean): Account active status
- `organizationId` (UUID, FK): Associated organization
- `createdAt`, `updatedAt` (timestamps)

#### 3. **Subscription**
- `id` (UUID): Primary key
- `userId`, `organizationId` (UUID, FK): References
- `planName` (varchar): Plan type
- `status` (varchar): active | cancelled | suspended | trial | past_due
- `price` (decimal): Plan price
- `billingCycle` (varchar): monthly | annual
- `stripeSubscriptionId`, `stripeCustomerId` (varchar): Stripe integration
- `startDate`, `endDate`, `nextBillingDate`, `cancelledAt` (dates)
- `maxUsers` (integer): User limit for plan
- `autoRenew` (boolean): Auto-renewal flag
- `createdAt`, `updatedAt` (timestamps)

#### 4. **AuditLog**
- `id` (UUID): Primary key
- `userId` (UUID, FK): User who performed action
- `action` (varchar): CREATE | UPDATE | DELETE | LOGIN | EXPORT
- `entityType` (varchar): Type of entity modified
- `entityId` (UUID): ID of modified entity
- `changes` (json): Change details
- `ipAddress`, `userAgent` (varchar): Request metadata
- `createdAt` (timestamp)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (recommended)

### Option 1: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps

# View Adminer (DB UI) at http://localhost:8080
# Default credentials: postgres / postgres
```

### Option 2: Manual PostgreSQL Setup

#### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb saas_management_db

# Connect to database
psql saas_management_db
```

#### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb saas_management_db

# Connect
sudo -u postgres psql saas_management_db
```

#### Windows (PostgreSQL Installer)
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and follow prompts
3. Note username (default: postgres) and password
4. Create database via pgAdmin or command line

## Environment Configuration

Update `.env` with your database credentials:

```env
DATABASE_HOST=localhost          # PostgreSQL host
DATABASE_PORT=5432              # PostgreSQL port
DATABASE_USER=postgres           # Database user
DATABASE_PASSWORD=postgres       # Database password
DATABASE_NAME=saas_management_db # Database name
DATABASE_SSL=false               # Enable SSL for production
```

## Database Migrations

TypeORM handles both schema creation and version control via migrations.

### Commands

```bash
# Generate migration (auto-detect changes)
npm run migration:generate -- InitialSchema

# Create empty migration
npm run migration:create -- AddNewColumn

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# View migration status
npm run typeorm migration:show
```

### How Migrations Work

1. **Schema Synchronization**: In development, `synchronize: true` auto-applies changes
2. **Named Migrations**: In production, manage explicit migrations
3. **Safe Rollback**: Each migration has up/down methods

### Initial Migration

The first migration (`1704067200000-InitialSchema.ts`) creates:
- Organizations table
- Users table
- Subscriptions table
- Audit logs table
- Indexes and foreign keys

**To apply initial migration:**
```bash
npm run migration:run
```

## Database Seeding

Pre-populate development database with sample data:

```bash
# Run seed script
npm run seed:run

# Sample credentials created:
# Email: admin@acme.example.com
# Password: Password123!
```

### Seed Data Included

- **2 Organizations**: Acme Corp, TechStart Inc
- **3 Users**: Mix of admin and regular users
- **2 Subscriptions**: Enterprise and Pro plans

## Connection Testing

```bash
# View tables
\dt

# Inspect user table
\d users

# Count records
SELECT COUNT(*) FROM users;

# Exit psql
\q
```

## TypeORM CLI Operations

```bash
# Show current database schema
npm run typeorm schema:sync

# Drop database
npm run typeorm schema:drop

# View available migrations
npm run typeorm migration:show

# Run TypeORM CLI directly
npm run typeorm -- --help
```

## Repository Access in Services

Each service uses TypeORM repositories for database operations:

```typescript
// Injected repository
@InjectRepository(User)
private userRepository: Repository<User>;

// Common operations
const user = await this.userRepository.findOne({ where: { id } });
const users = await this.userRepository.find();
const saved = await this.userRepository.save(newUser);
await this.userRepository.remove(user);
```

## Advanced Features

### Query Relations

```typescript
// Load with relations
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['organization', 'subscriptions'],
});
```

### Pagination

```typescript
const [users, total] = await this.userRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});
```

### Transactions

```typescript
await this.userRepository.manager.transaction(async (manager) => {
  await manager.save(user);
  await manager.save(organization);
});
```

## Troubleshooting

### Connection Failures

```bash
# Check PostgreSQL is running
psql -U postgres -h localhost -d postgres -c "SELECT version();"

# Verify credentials in .env
cat .env | grep DATABASE

# Check logs
docker logs saas_postgres  # if using Docker
```

### Migration Errors

```bash
# Reset to clean state
npm run typeorm schema:drop
npm run migration:run

# Or revert and re-run
npm run migration:revert
npm run migration:run
```

### Table Not Exists

```bash
# Ensure migrations ran
npm run typeorm migration:show

# Apply migrations
npm run migration:run

# Check tables exist
npm run typeorm schema:show
```

## Performance Tips

1. **Indexes**: Added on frequently queried columns (email, organizationId, status)
2. **Eager vs Lazy**: Use `relations` option only when needed
3. **Query Optimization**: Use `select` to fetch specific columns
4. **Connection Pooling**: TypeORM handles automatically
5. **Prepared Statements**: Used by default for security

## Backup & Restore

### Backup Database

```bash
# Using pg_dump
pg_dump -U postgres saas_management_db > backup.sql

# Docker backup
docker exec saas_postgres pg_dump -U postgres saas_management_db > backup.sql
```

### Restore Database

```bash
# From backup
psql -U postgres saas_management_db < backup.sql

# Docker restore
cat backup.sql | docker exec -i saas_postgres psql -U postgres saas_management_db
```

## Production Checklist

- [ ] Set strong database password
- [ ] Enable `DATABASE_SSL=true`
- [ ] Configure backups and replication
- [ ] Use environment-specific credentials
- [ ] Review indexes for query performance
- [ ] Set up monitoring and alerts
- [ ] Document custom queries and procedures
- [ ] Test migration strategy
- [ ] Configure database user with limited permissions
- [ ] Enable query logging for audit

## Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS + TypeORM](https://docs.nestjs.com/techniques/database)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)

---

**Current Database Status**: ✓ Configured & Ready
**Schema Version**: 1704067200000
**Tables**: 4 (Organizations, Users, Subscriptions, AuditLogs)
