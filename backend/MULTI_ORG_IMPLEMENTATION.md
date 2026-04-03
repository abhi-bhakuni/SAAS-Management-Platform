# Multi-Organization Workspace Switching Implementation

## Overview

This document describes the complete implementation of multi-organization workspace switching for the SAAS Management Platform. The system now supports:

- **Many-to-many user-organization relationships** via join table
- **Organization-specific roles** (OWNER, ADMIN, MEMBER) independent per organization
- **JWT workspace context** carrying `selectedOrgId` and `orgRole`
- **Workspace switching endpoint** for users to change active workspace
- **Existing user invitations** to join new organizations without duplicate accounts
- **Member management endpoints** for org admins to manage members

---

## Architecture Overview

### Key Changes from Single-Tenant to Multi-Tenant

| Aspect | Before | After |
|--------|--------|-------|
| **User-Org Relationship** | 1-to-many (FK on users.organizationId) | Many-to-many (join table) |
| **Role Assignment** | Global only (admin/manager/member) | Per-organization (OWNER/ADMIN/MEMBER) |
| **JWT Payload** | Single `organizationId` | `selectedOrgId` + `orgRole` |
| **User Queries** | Direct column filter | Query through memberships |
| **Workspace Changes** | Not possible | POST /auth/switch-workspace |
| **Invite Flow** | Always create new user | Link to existing user if email matches |
| **Guards** | Check direct FK | Query join table |

---

## Database Schema Changes

### New Table: `user_organization_memberships`

```sql
CREATE TABLE user_organization_memberships (
  userId UUID PRIMARY KEY,
  organizationId UUID PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'MEMBER',
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IDX_user_org_memberships_org_role ON user_organization_memberships(organizationId, role);
CREATE INDEX IDX_user_org_memberships_user_org ON user_organization_memberships(userId, organizationId);
```

### Modified Tables

**users** table:
- ❌ REMOVED: `organizationId` column (FK)
- ✅ ADDED: `memberships` relationship (virtual, via join table)

**organizations** table:
- ❌ REMOVED: `users` relationship (one-to-many)
- ✅ ADDED: `memberships` relationship (one-to-many via join table)

---

## New Entities

### UserOrganizationMembership Entity

```typescript
@Entity('user_organization_memberships')
export class UserOrganizationMembership {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  organizationId: string;

  @Column({
    type: 'varchar',
    default: OrganizationRole.MEMBER,
  })
  role: OrganizationRole;

  @ManyToOne(() => User, u => u.memberships, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Organization, o => o.memberships, { onDelete: 'CASCADE' })
  organization: Organization;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isOwner(): boolean { return this.role === OrganizationRole.OWNER; }
  isAdmin(): boolean { return this.role === OrganizationRole.ADMIN; }
  isMember(): boolean { return this.role === OrganizationRole.MEMBER; }
  canManageMembers(): boolean { return this.isOwner() || this.isAdmin(); }
}
```

---

## JWT Payload Structure

### Old (Single-Org)
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "admin",
  "organizationId": "org-id",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### New (Multi-Org with Workspace Context)
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "admin",
  "selectedOrgId": "org-id-1",
  "orgRole": "OWNER",
  "iat": 1234567890,
  "exp": 1234654290
}
```

User can have multiple org memberships, but JWT always carries their current workspace context.

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register new user (no org assignment initially)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "role": "member"
  }'
```

Response:
```json
{
  "access_token": "",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member"
  },
  "expiresIn": 0
}
```

#### POST /auth/login
Login user (returns token with first org membership)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.example.com",
    "password": "Password123!"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "admin@acme.example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "organizations": [
      {
        "id": "org-1-uuid",
        "name": "Acme Corporation",
        "role": "OWNER"
      },
      {
        "id": "org-2-uuid",
        "name": "TechStart Inc",
        "role": "MEMBER"
      }
    ],
    "selectedOrgId": "org-1-uuid",
    "selectedOrgRole": "OWNER"
  },
  "expiresIn": 86400
}
```

#### POST /auth/switch-workspace
Switch active workspace (PROTECTED)

```bash
curl -X POST http://localhost:3000/auth/switch-workspace \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-2-uuid"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "selectedOrgId": "org-2-uuid",
  "selectedOrgRole": "MEMBER"
}
```

#### POST /auth/accept-invite
Accept organization invite (PUBLIC or PROTECTED for existing users)

```bash
curl -X POST http://localhost:3000/auth/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invite-token-from-email",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "invited@example.com"
  },
  "invite": {
    "id": "invite-uuid",
    "organizationId": "org-uuid",
    "email": "invited@example.com",
    "role": "MEMBER",
    "status": "ACCEPTED",
    "acceptedAt": "2025-04-02T12:00:00Z"
  }
}
```

### Organization Member Management Endpoints

#### GET /organizations/:orgId/members
List organization members (paginated)

```bash
curl -X GET "http://localhost:3000/organizations/org-uuid/members?page=1&limit=20" \
  -H "Authorization: Bearer <your-jwt-token>"
```

Response:
```json
{
  "data": [
    {
      "userId": "user-1-uuid",
      "organizationId": "org-uuid",
      "role": "OWNER",
      "joinedAt": "2025-04-01T10:00:00Z",
      "user": {
        "id": "user-1-uuid",
        "email": "admin@acme.example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    {
      "userId": "user-2-uuid",
      "organizationId": "org-uuid",
      "role": "MEMBER",
      "joinedAt": "2025-04-01T15:30:00Z",
      "user": {
        "id": "user-2-uuid",
        "email": "user@acme.example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /organizations/:orgId/members
Add member to organization (org admin/owner only)

```bash
curl -X POST http://localhost:3000/organizations/org-uuid/members \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-to-add",
    "role": "MEMBER"
  }'
```

#### PUT /organizations/:orgId/members/:userId
Update member role (org admin/owner only)

```bash
curl -X PUT http://localhost:3000/organizations/org-uuid/members/user-uuid \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN"
  }'
```

#### DELETE /organizations/:orgId/members/:userId
Remove member from organization (org admin/owner only)

```bash
curl -X DELETE http://localhost:3000/organizations/org-uuid/members/user-uuid \
  -H "Authorization: Bearer <admin-token>"
```

---

## Setup & Migration Guide

### Prerequisites

- Node.js 16+
- PostgreSQL 14+ (or run via Docker)
- npm or yarn

### Docker Setup (Recommended)

```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379 (optional)
- Adminer on port 8080 (database UI)

### Manual Database Setup

```bash
# Install PostgreSQL locally or use cloud provider
# Create database
createdb saas_management_db -U postgres

# Update .env file with your database credentials
nano .env
```

### Run Migrations

```bash
cd backend

# Install dependencies
npm install

# Generate TypeORM config
npm run build

# Run pending migrations
npm run migration:run

# Verify migrations by checking schema
npm run migration:show
```

Expected output:
```
 ✓ MigrateToUserOrganizationMemberships1712398800000
```

### Seed Sample Data

```bash
npm run seed:run
```

This creates:
- 2 organizations (Acme Corporation, TechStart Inc)
- 3 users with memberships
- 2 subscriptions

Sample credentials:
```
Email: admin@acme.example.com
Password: Password123!
```

### Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

---

## Test Scenarios

### Scenario 1: User Registration and Organization Membership

**What happens:**
1. New user registers via POST /auth/register
2. User is created WITHOUT organization membership
3. No JWT token returned (user has no org yet)

**Expected behavior:**
- User exists in database
- No rows in user_organization_memberships for this user
- User cannot access protected routes (no valid org context)

### Scenario 2: User Accepts Invite to First Organization

**What happens:**
1. Admin sends invite via POST /organizations/:orgId/invites
2. Invite email sent with token
3. User accepts via POST /auth/accept-invite with token
4. System creates membership in organization

**Expected behavior:**
- User added to organization with designated role
- Membership record created in join table
- User can now login and receive JWT with selectedOrgId
- JWT includes orgRole from membership

### Scenario 3: Existing User Accepts Invite to Second Organization

**What happens:**
1. User A already member of Org 1 (OWNER)
2. Admin of Org 2 sends invite to User A's email
3. User A accepts invite
4. System adds User A to Org 2 via new membership

**Expected behavior:**
- NO new user created (existing user reused)
- User membership count increases to 2
- User can switch between orgs
- Each org has independent role for User A

### Scenario 4: Workspace Switching

**What happens:**
1. User logs in (gets token with Org 1 as selectedOrgId)
2. User calls POST /auth/switch-workspace with Org 2 ID
3. System verifies membership exists
4. New JWT issued with Org 2 as selectedOrgId

**Expected behavior:**
- Old token invalid for Org 2 requests
- New token valid only for Org 2
- Org-specific role included in orgRole claim
- User can only access data from selectedOrgId

### Scenario 5: Role-Based Access Control

**What happens:**
1. User A (MEMBER in Org 1) tries to add member via POST /organizations/org1/members
2. Request includes @OrgRoles(ADMIN) guard
3. User A's orgRole is MEMBER, not ADMIN

**Expected behavior:**
- Request rejected with 403 Forbidden
- Message: "This action requires one of the following roles: ADMIN. Your current role: MEMBER"
- System admin (_global role_) BYPASS (can access any org)

### Scenario 6: Workspace Context Validation

**What happens:**
1. User has token for Org 1 (selectedOrgId: org-1-uuid)
2. User tries to access POST /organizations/org-2-uuid/members
3. Route includes validation: orgId !== user.selectedOrgId

**Expected behavior:**
- Request rejected with 403 Forbidden
- Message: "Workspace mismatch - cannot access different org"
- User must switch workspace first

### Scenario 7: Member Management

**What happens:**
1. Org admin adds member: POST /organizations/:orgId/members
2. Admin updates member role: PUT /organizations/:orgId/members/:userId
3. Admin tries to remove last owner

**Expected behavior:**
- Member successfully added with MEMBER role
- Member role updated to ADMIN
- Removal rejected with error (cannot remove only owner)

---

## File Structure

### New Files Created

```
src/
├── modules/
│   ├── users/
│   │   ├── entities/
│   │   │   └── user-organization-membership.entity.ts          [NEW]
│   │   └── repositories/
│   │       └── organization-membership.repository.ts            [NEW]
│   ├── organizations/
│   │   ├── controllers/
│   │   │   └── organization-members.controller.ts              [NEW]
│   │   ├── services/
│   │   │   └── user-organization.service.ts                   [NEW]
│   │   └── dtos/
│   │       ├── add-member.dto.ts                               [NEW]
│   │       ├── update-member-role.dto.ts                       [NEW]
│   │       └── member-response.dto.ts                          [NEW]
│   ├── auth/
│   │   └── guards/
│   │       └── org-role.guard.ts                               [NEW]
└── migrations/
    └── 1712398800000-MigrateToUserOrganizationMemberships.ts  [NEW]
```

### Modified Files

```
src/
├── modules/
│   ├── users/
│   │   ├── entities/user.entity.ts                    [MODIFIED]
│   │   ├── services/users.service.ts                  [MODIFIED]
│   │   └── users.module.ts                            [MODIFIED]
│   ├── organizations/
│   │   ├── entities/organization.entity.ts            [MODIFIED]
│   │   ├── services/
│   │   │   ├── organizations.service.ts               [MODIFIED]
│   │   │   └── organization-invites.service.ts        [MODIFIED]
│   │   ├── organizations.module.ts                    [MODIFIED]
│   │   └── dtos/index.ts                              [MODIFIED]
│   ├── auth/
│   │   ├── services/auth.service.ts                   [MODIFIED]
│   │   ├── strategies/jwt.strategy.ts                 [MODIFIED]
│   │   ├── controllers/auth.controller.ts             [MODIFIED]
│   │   ├── decorators/index.ts                        [MODIFIED]
│   │   └── guards/org-membership.guard.ts             [MODIFIED]
│   └── subscriptions/
│       └── controllers/subscriptions.controller.ts    [MODIFIED]
└── config/
    └── database.config.ts                             [MODIFIED]
```

---

## Data Migration Process

The migration script (`1712398800000-MigrateToUserOrganizationMemberships.ts`) handles:

1. **Create join table** with composite primary key
2. **Migrate existing data** with intelligent role assignment:
   - First admin in org → OWNER
   - Other admins → ADMIN
   - All others → MEMBER
3. **Create indexes** for performance
4. **Drop old FK** on users.organizationId
5. **Drop old column** (can be reverted if needed)

Migration is reversible via `npm run migration:revert`

---

## Validation & Testing Checklist

### ✅ Data Layer
- [x] UserOrganizationMembership entity created
- [x] Composite primary key on (userId, organizationId)
- [x] Proper foreign key relationships with CASCADE delete
- [x] Indexes on org and membership lookups
- [x] Migration script handles data transformation

### ✅ Authentication Layer
- [x] JWT payload includes selectedOrgId + orgRole
- [x] Token generation queries membership table
- [x] Register returns empty token (no org yet)
- [x] Login requires at least one org membership
- [x] Switch workspace validates membership

### ✅ Authorization Layer
- [x] OrgMembershipGuard validates workspace context
- [x] OrgRoleGuard checks org-specific roles
- [x] Role hierarchy enforced (OWNER > ADMIN > MEMBER)
- [x] System admin bypasses org-level checks
- [x] Workspace mismatch returns 403

### ✅ Business Logic
- [x] CreateInvite allows existing users if not in org
- [x] AcceptInvite links to existing user if email matches
- [x] AcceptInvite creates new user if no match
- [x] Member management endpoints (add/update/remove)
- [x] Prevents removing only org owner
- [x] Prevents demoting only org owner if user tries self-demotion

### ✅ Service Layer
- [x] UserOrganizationService handles all membership operations
- [x] OrganizationMembershipRepository has all common queries
- [x] OrganizationsService counts members via join table
- [x] All services properly injected into modules

### ✅ Controllers
- [x] Auth controller has switch-workspace endpoint
- [x] Organization members controller created
- [x] All endpoints validate workspace context
- [x] All endpoints include proper guards and decorators

### ✅ DTOs & Decorators
- [x] SwitchWorkspaceDto added
- [x] SwitchWorkspaceResponseDto fixed return type
- [x] AddMemberDto created
- [x] UpdateMemberRoleDto created
- [x] MemberResponseDto created
- [x] Roles decorator exported (was missing)
- [x] OrgRoles decorator working

### ✅ Module Configuration
- [x] Auth module has UserOrganizationMembership registered
- [x] Organizations module has UserOrganizationMembership registered
- [x] Users module has OrganizationMembershipRepository
- [x] Database config has UserOrganizationMembership entity

### ✅ Compilation
- [x] TypeScript builds without errors
- [x] All types properly imported and exported
- [x] No any types except where necessary (User responses)

---

## Known Limitations & Future Improvements

### Current Scope
- Single workspace per JWT (can switch, not simultaneous)
- No audit logging of member changes
- No permission granularity (can't restrict specific features per role)
- No team/group management within org

### Potential Enhancements
1. **Audit Trail**: Log all member additions, removals, role changes
2. **Permission Matrix**: Fine-grained permissions per org role
3. **Bulk Operations**: Add/remove multiple members at once
4. **Role Templates**: Pre-configured role sets for common scenarios
5. **Invitation Expiry**: Auto-expire invites after N days
6. **Member Activity**: Track last login, active users per org
7. **SSO Integration**: Organization-specific SSO configuration

---

## Troubleshooting

### Issue: "User must be a member of at least one organization"

**Cause**: User registered but was never added to an organization

**Solution**:
1. Create organization invite
2. User accepts invite (creates membership)
3. User can now login

### Issue: "User is not a member of this organization"

**Cause**: JWT selectedOrgId doesn't exist in memberships table OR user removed from org

**Solution**:
1. Call POST /auth/switch-workspace with valid org
2. Or re-invite user to organization

### Issue: "Workspace mismatch - cannot access different org"

**Cause**: JWT selectedOrgId doesn't match route :orgId parameter

**Solution**:
1. User must switch workspace first: POST /auth/switch-workspace
2. Then access the org's endpoints

### Issue: Migration fails "FK constraint already exists"

**Cause**: Migration already ran or partial execution

**Solution**:
```bash
npm run migration:revert
npm run migration:run
```

---

## Deployment Notes

### Pre-Deployment Checklist
- [ ] DATABASE_HOST, DATABASE_PORT env vars set correctly
- [ ] DATABASE_USER has create/alter table permissions
- [ ] JWT_SECRET set to secure random value (not dev default)
- [ ] CORS_ORIGIN configured for frontend domain
- [ ] Backup existing database before migration

### Migration Strategy
1. **Backup database** before running migration
2. **Test in staging** first (full data migration)
3. **Run migration on production**: `npm run migration:run`
4. **Verify data integrity** post-migration
5. **Monitor** for 24-48 hours for any issues

### Rollback Plan
If migration causes issues:
```bash
npm run migration:revert
# Data will be restored to previous schema
```

---

## References

- **Entity Relationships**: ORM handles CASCADE delete automatically
- **TypeORM Composite Keys**: Using @PrimaryColumn() twice
- **JWT Custom Claims**: selectedOrgId/orgRole are custom claims
- **Role Hierarchy**: Implemented in OrgRoleGuard.hasRequiredOrgRole()
- **Guards Composition**: JwtAuthGuard → OrgMembershipGuard → OrgRoleGuard
