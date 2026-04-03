# PostgreSQL + TypeORM Setup - Quick Start Guide

## ✅ What's Been Set Up

Your NestJS backend now has **TypeORM** fully integrated with **PostgreSQL** including:

### Database Features
- ✓ 4 production-ready entities (Organization, User, Subscription, AuditLog)
- ✓ Automated migrations system with version control
- ✓ Database seeding with sample data
- ✓ Docker Compose configuration for easy setup
- ✓ Fully indexed schema for performance
- ✓ Relationship management (1-to-Many, Many-to-1)

### Code Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts          # TypeORM configuration
│   ├── modules/
│   │   ├── users/entities/
│   │   │   └── user.entity.ts         # User model
│   │   ├── subscriptions/entities/
│   │   │   └── subscription.entity.ts # Subscription model
│   │   ├── organizations/entities/
│   │   │   └── organization.entity.ts # Organization model
│   │   └── database/
│   │       └── database.module.ts     # TypeORM DI module
│   ├── common/entities/
│   │   └── audit-log.entity.ts        # Audit trail
│   └── migrations/
│       └── 1704067200000-InitialSchema.ts  # Schema migration
├── src/database/seeds/
│   └── seed.ts                         # Seed script
├── docker-compose.yml                  # Docker setup
├── ormconfig.ts                        # TypeORM CLI config
├── DATABASE_SETUP.md                   # Detailed guide
└── .env.example                        # Environment template
```

---

## 🚀 Getting Started (2 Options)

### Option A: Docker (Recommended - 1 Command)

```bash
cd backend

# Start PostgreSQL + Redis + Adminer UI
docker-compose up -d

# Verify services
docker-compose ps

# You now have:
# PostgreSQL: localhost:5432
# Adminer UI: http://localhost:8080 (user: postgres / pass: postgres)
# Redis: localhost:6379
```

### Option B: Manual PostgreSQL (macOS/Linux)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb saas_management_db
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb saas_management_db
```

**Windows:**
- Download PostgreSQL: https://www.postgresql.org/download/windows/
- Install with default credentials
- Create database via pgAdmin or command line

---

## 📊 Database Setup

### 1. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your database credentials
# For local testing, defaults work:
# DATABASE_HOST=localhost
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=saas_management_db
```

### 2. Run Migrations

```bash
# Apply all pending migrations
npm run migration:run

# Verify migrations applied
npm run typeorm migration:show
```

### 3. Seed Sample Data (Optional)

```bash
npm run seed:run

# Sample credentials:
# Email: admin@acme.example.com
# Password: Password123!
```

### 4. Verify Setup

```bash
# Build project
npm run build

# Start application
npm run dev

# Should see:
# ✓ TypeORM connected to PostgreSQL
# ✓ Application running on http://localhost:3000
# ✓ All 4 modules loaded
```

---

## 📋 Database Schema

### Tables Created

**organizations** - Multi-tenant support
```
id (UUID), name, slug*, description, website, industry, status, settings
*unique
```

**users** - User accounts with roles
```
id (UUID), email*, firstName, lastName, password, role, emailVerified,
organizationId (FK), createdAt, updatedAt
*unique with index
```

**subscriptions** - Billing and plan management
```
id (UUID), userId (FK), organizationId (FK), planName, status, price,
billingCycle, stripeSubscriptionId, startDate, nextBillingDate, maxUsers
```

**audit_logs** - Activity tracking
```
id (UUID), userId (FK), action, entityType, entityId, changes (JSON), 
ipAddress, userAgent, createdAt
```

---

## 💻 Available Commands

### Database Operations
```bash
npm run migration:generate -- <MigrationName>  # Auto-detect changes
npm run migration:create -- <MigrationName>    # Create empty migration
npm run migration:run                          # Apply migrations
npm run migration:revert                       # Undo last migration
npm run seed:run                               # Load seed data
npm run typeorm migration:show                 # View migration status
```

### Application
```bash
npm run dev              # Development with hot reload
npm run build            # Compile TypeScript
npm run prod             # Run production build
npm run lint             # ESLint code check
npm run format           # Prettier formatting
npm test                 # Jest tests
```

### Docker
```bash
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs      # View logs
docker-compose ps        # Status
```

---

## 🔍 Testing Connections

### Via CLI
```bash
# Connect to PostgreSQL
psql -U postgres -d saas_management_db

# View tables (in psql)
\dt

# Count users
SELECT COUNT(*) FROM users;

# View specific user
SELECT * FROM users LIMIT 1;

# Exit
\q
```

### Via Adminer Web UI
1. Open http://localhost:8080
2. Login with postgres / postgres
3. Select saas_management_db
4. Browse tables and data

### Via API
```bash
# Health check
curl http://localhost:3000/health

# Get users
curl http://localhost:3000/users

# Response should show paginated results
```

---

## 🛠️ TypeORM Features Used

### Decorators
```typescript
@Entity()        // Table name
@Column()        // Database column
@PrimaryGeneratedColumn('uuid')  // Primary key
@ManyToOne()     // Foreign key relationship
@OneToMany()     // Inverse relationship
@Index()         // Database index
@Unique()        // Unique constraint
@CreateDateColumn()  // Auto timestamp
@UpdateDateColumn()  // Auto update timestamp
```

### Repository Pattern
```typescript
// Injected repositories
@InjectRepository(User)
private userRepository: Repository<User>;

// Common operations
await this.userRepository.findOne({ where: { id } });
await this.userRepository.find();
await this.userRepository.save(entity);
await this.userRepository.remove(entity);
await this.userRepository.findAndCount(); // Pagination
```

---

## 📝 Next Steps

### For Backend Developers

1. **Implement Authentication**
   - Hash passwords with bcrypt
   - Generate JWT tokens
   - Create auth guards
   - → See: `src/modules/auth/`

2. **Add Validation**
   - Create DTOs with decorators
   - Implement custom validators
   - → File: `src/modules/*/dtos/`

3. **Error Handling**
   - Build global exception filter
   - Custom error responses
   - Logging middleware
   - → File: `src/filters/`

4. **Add Tests**
   - Unit tests for services
   - Integration tests for controllers
   - Database test fixtures

### For Database Team

1. **Backup Strategy** - Set up automated backups
2. **Monitoring** - Query performance monitoring
3. **Scaling** - Read replicas for production
4. **Security** - SSL, credentials rotation, audit logs
5. **Optimization** - Query analysis, index tuning

### For DevOps

1. **CI/CD Integration** - Database migrations in pipeline
2. **Environment Management** - Separate dev/staging/prod databases
3. **Secrets Management** - Database credentials in vault
4. **Monitoring** - Database health & performance alerts
5. **Disaster Recovery** - Backup/restore procedures

---

## ⚙️ Configuration Files

### `.env` (Development)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=saas_management_db
NODE_ENV=development
```

### `.env.production` (Production - Create as needed)
```env
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_USER=prod_user
DATABASE_PASSWORD=****SECURE****
DATABASE_NAME=saas_management_prod
DATABASE_SSL=true
NODE_ENV=production
```

### `ormconfig.ts` (TypeORM CLI)
- Auto-loads `.env` for migrations
- Configures entities directory
- Sets migration source/output paths

### `docker-compose.yml`
- PostgreSQL 16 Alpine (lightweight)
- Redis 7 (for caching/sessions)
- Adminer (database UI)
- Health checks enabled

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
psql -U postgres -h localhost -d postgres -c "SELECT version();"

# Or with Docker
docker logs saas_postgres
```

### Migration Fails
```bash
# Check migration status
npm run typeorm migration:show

# Reset database (CAREFUL - loses data)
npm run typeorm schema:drop
npm run migration:run
```

### Tables Not Visible
```bash
# Verify migrations ran
npm run typeorm migration:show

# Apply migrations
npm run migration:run

# Check in psql
psql saas_management_db -c "\dt"
```

---

## 📚 Documentation

**Detailed guides:**
- `DATABASE_SETUP.md` - Complete database reference
- `README.md` - Project overview
- `.env.example` - All configuration options

**External resources:**
- [TypeORM Docs](https://typeorm.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [NestJS + TypeORM](https://docs.nestjs.com/techniques/database)

---

## ✨ Summary

Your backend now has:
- ✅ PostgreSQL database configured
- ✅ TypeORM connecting both frameworks
- ✅ 4 production entities with relationships
- ✅ Automated migrations with version control
- ✅ Seeding for development data
- ✅ Docker setup for easy development
- ✅ Ready for authentication implementation

**Start developing:** `npm run dev`

**Access Adminer:** http://localhost:8080

**Default Credentials:**
- Database: postgres / postgres
- Sample User: admin@acme.example.com / Password123!

---

**Setup Status**: ✅ Complete & Ready for Development
**Database**: PostgreSQL 16
**ORM**: TypeORM 0.3.17
**NestJS Version**: 10.0.0
