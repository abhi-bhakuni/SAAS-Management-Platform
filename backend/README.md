# Backend — SAAS Management Platform

NestJS 10 REST API with JWT auth, multi-org workspaces, Stripe billing, real-time chat, and PostgreSQL.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)

### Setup
```bash
cp .env.example .env        # fill in all values
docker-compose up -d        # start PostgreSQL + Redis
npm install
npm run migration:run
npm run seed:run
npm run dev
```

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | API |
| `http://localhost:3000/api` | Swagger UI (dev only) |
| `http://localhost:3000/health` | Health check |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
NODE_ENV=development
PORT=3000

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=saas_management_db
DATABASE_SSL=false

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRATION=3600

# CORS
CORS_ORIGIN=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@yourapp.com
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

LOG_LEVEL=debug
```

---

## Scripts

```bash
npm run dev              # Dev server with hot reload
npm run build            # Compile TypeScript → dist/
npm run prod             # Run production build
npm run lint
npm run format
npm test
npm run test:cov

npm run migration:run    # Apply pending migrations
npm run migration:revert # Undo last migration
npm run migration:generate -- <Name>
npm run seed:run         # Seed subscription plans
```

---

## Module Architecture

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── enums/                 # Shared enums (roles, statuses, priorities)
│   ├── entities/              # AuditLog entity
│   ├── decorators/            # @CurrentUser, @Public, @Roles
│   ├── interfaces/
│   └── exceptions/
├── config/                    # database.config.ts
├── filters/                   # GlobalExceptionFilter
├── interceptors/              # LoggingInterceptor, TimeoutInterceptor
├── migrations/                # 9 TypeORM migrations
└── modules/
    ├── auth/                  # JWT, 2FA, password reset, workspace switch
    ├── users/                 # User CRUD + org memberships
    ├── organizations/         # Orgs, members, invites
    ├── projects/              # Projects + Tasks + status history
    ├── subscriptions/         # Stripe billing, plans, webhooks
    ├── analytics/             # Dashboard KPI stats
    ├── activity/              # Org activity/audit feed
    ├── chat/                  # Chat conversations + Socket gateway
    ├── websocket/             # Socket.io module
    ├── health/                # Health checks
    ├── email/                 # Nodemailer + Handlebars templates
    └── database/              # TypeORM DataSource module
```

---

## API Endpoints

### Auth
```
POST   /auth/register
POST   /auth/login
GET    /auth/me                      (JWT)
POST   /auth/switch-workspace        (JWT)
POST   /auth/accept-invite
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password         (JWT)
GET    /auth/login-activity          (JWT)
POST   /auth/2fa/generate            (JWT)
POST   /auth/2fa/enable              (JWT)
POST   /auth/2fa/disable             (JWT)
DELETE /auth/close-organization      (JWT)
DELETE /auth/delete-account          (JWT)
```

### Organizations
```
GET    /organizations
POST   /organizations
GET    /organizations/:id
PUT    /organizations/:id
DELETE /organizations/:id
GET    /organizations/dashboard-stats
GET    /organizations/members
PUT    /organizations/members/:userId
DELETE /organizations/members/:userId
POST   /organizations/invites
GET    /organizations/invites
DELETE /organizations/invites/:id
```

### Projects & Tasks
```
GET    /projects
POST   /projects
DELETE /projects/:id
GET    /tasks                        ?projectId=
POST   /tasks
PUT    /tasks/:id
PATCH  /tasks/:id/status
DELETE /tasks/:id
GET    /tasks/assignable-users
```

### Subscriptions & Billing
```
GET    /subscriptions/plans
GET    /subscriptions/me
POST   /subscriptions/create-checkout-session
POST   /subscriptions/sync-checkout-session
POST   /subscriptions/create-portal-session
POST   /subscriptions/cancel
POST   /subscriptions/reactivate
GET    /subscriptions/check-feature/:feature
POST   /webhooks/stripe
```

### Other
```
GET    /activity
GET    /analytics/*
GET    /health
GET/POST /chat/*
GET    /api                          Swagger UI (dev only)
```

---

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `1704067200000-InitialSchema` | Users, Organizations, Subscriptions, AuditLogs |
| `1704067200001-AddUserSecurityColumns` | 2FA, loginAttempts, lockUntil |
| `1704067200001-UpdateUserRoles` | Role enum update |
| `1712311200000-CreateOrganizationInvites` | Invite system |
| `1712398800000-MigrateToUserOrganizationMemberships` | Multi-org junction table |
| `1712485200000-CreateProjects` | Projects table |
| `1712571600000-CreateTasks` | Tasks + status history |
| `1735689600000-CreateSubscriptionPlans` | Subscription plans |
| `1736000000000-AddUserBio` | User bio field |

---

## Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt, 10 rounds |
| JWT | Global `JwtAuthGuard`, `@Public()` opt-out |
| Brute-force protection | 5 failed attempts → 15-min lock |
| 2FA | TOTP via `otplib` + QR code |
| Password reset | Token-based email flow |
| Multi-org isolation | JWT carries `selectedOrgId` + `orgRole` |
| Sensitive fields | `password`, `twoFactorSecret` all `select:false` |
| Input validation | `class-validator`, `whitelist: true` |
| SQL injection | TypeORM parameterized queries |
| CORS | Configurable via `CORS_ORIGIN` env var |

---

## Production Deployment

### Architecture
```
Internet → Nginx (80/443) → NestJS App (3000) → PostgreSQL + Redis
```

### Deploy
```bash
cp .env.example .env    # use production values
./deploy.sh             # full build + deploy
./deploy.sh build       # build Docker image only
./deploy.sh migrate     # run migrations in container
./deploy.sh logs        # tail logs
./deploy.sh stop        # stop all services
```

### Post-deploy
```bash
docker-compose -f docker-compose.prod.yml exec app npm run migration:run
docker-compose -f docker-compose.prod.yml exec app npm run seed:run   # first deploy only
curl https://api.yourdomain.com/health
```

### Database backup / restore
```bash
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres saas_management_db > backup_$(date +%Y%m%d_%H%M%S).sql

docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres saas_management_db < backup_file.sql
```

### Production env checklist
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — 32+ chars, randomly generated
- [ ] Live Stripe keys (`sk_live_`)
- [ ] `CORS_ORIGIN` set to frontend domain
- [ ] `DATABASE_SSL=true` if using managed PostgreSQL
- [ ] Never commit `.env` to git

---

## Docker

```bash
# Development
docker-compose up -d
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/core` | Framework |
| `typeorm` + `pg` | ORM + PostgreSQL driver |
| `@nestjs/jwt` + `passport-jwt` | JWT auth |
| `bcrypt` | Password hashing |
| `otplib` + `qrcode` | 2FA TOTP |
| `stripe` | Payments |
| `@nestjs-modules/mailer` | Email |
| `socket.io` | Real-time WebSocket |
| `@nestjs/swagger` | API docs |
| `@nestjs/terminus` | Health checks |
| `class-validator` | DTO validation |
