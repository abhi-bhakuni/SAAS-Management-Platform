# User & Organization Models Documentation

## Overview

This document provides comprehensive documentation for the User and Organization models, including their structure, relationships, DTOs, and usage patterns.

---

## User Model

### Entity: `User` (`src/modules/users/entities/user.entity.ts`)

#### Columns

| Column | Type | Length | Nullable | Default | Description |
|--------|------|--------|----------|---------|-------------|
| `id` | UUID | - | No | auto-generated | Primary key (UUID v4) |
| `email` | varchar | 255 | No | - | User email (unique, indexed) |
| `firstName` | varchar | 255 | No | - | User first name |
| `lastName` | varchar | 255 | No | - | User last name |
| `password` | varchar | 255 | No | - | Bcrypt hashed password (select: false) |
| `role` | varchar | 50 | No | 'user' | User role (admin\|user\|viewer) |
| `emailVerified` | boolean | - | No | false | Email verification status |
| `isActive` | boolean | - | No | true | Account active status |
| `lastLoginAt` | varchar | - | Yes | null | Last login timestamp |
| `loginAttempts` | integer | - | No | 0 | Failed login attempts counter |
| `lockUntil` | varchar | - | Yes | null | Account lock timestamp |
| `verificationToken` | varchar | - | Yes | null | Email verification token (select: false) |
| `organizationId` | UUID | - | Yes | null | Foreign key to organization |
| `createdAt` | timestamp | - | No | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | timestamp | - | No | CURRENT_TIMESTAMP | Update timestamp |

#### Relationships

```
User (Many) ──→ Organization (One) [nullable]
User (One) ──→ Subscription (Many)
User (One) ──→ AuditLog (Many)
```

#### Methods

##### Password Management

```typescript
// Automatically hash password on insert/update
@BeforeInsert()
@BeforeUpdate()
async hashPassword(): Promise<void>

// Validate password against stored hash
async validatePassword(password: string): Promise<boolean>
```

##### Account Information

```typescript
// Get full name
getFullName(): string
// Returns: "John Doe"

// Check if account is locked (brute force protection)
isAccountLocked(): boolean

// Increment failed login attempts (up to 5)
increaseLoginAttempts(): void
// Locks account for 15 minutes after 5 failed attempts

// Reset login attempts after successful login
resetLoginAttempts(): void
```

#### Example Usage

```typescript
// Creating a user
const newUser = await usersService.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePass123!', // Will be auto-hashed
  role: UserRole.USER,
});

// Logging in
const login = await usersService.login({
  email: 'john@example.com',
  password: 'SecurePass123!',
});

// Validate password
const isValid = await user.validatePassword('SecurePass123!');
```

### User DTOs

#### 1. CreateUserDto

**File:** `src/modules/users/dtos/create-user.dto.ts`

```typescript
interface CreateUserDto {
  email: string;              // Required, valid email
  firstName: string;          // Required, 2-50 chars
  lastName: string;           // Required, 2-50 chars
  password: string;           // Required, 8+ chars, complex password
  role?: UserRole;            // Optional, default: USER
  organizationId?: string;    // Optional, organization FK
}
```

**Validation Rules:**
- Email: Valid email format
- FirstName/LastName: 2-50 characters
- Password: 8-50 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- Role: Must be valid UserRole enum

#### 2. UpdateUserDto

**File:** `src/modules/users/dtos/update-user.dto.ts`

```typescript
interface UpdateUserDto {
  email?: string;             // Optional
  firstName?: string;         // Optional
  lastName?: string;          // Optional
  role?: UserRole;            // Optional
  isActive?: boolean;         // Optional
}
```

**All fields are optional** for PATCH requests.

#### 3. LoginDto

**File:** `src/modules/users/dtos/login.dto.ts`

```typescript
interface LoginDto {
  email: string;              // Required, valid email
  password: string;           // Required, non-empty
}
```

#### 4. ChangePasswordDto

**File:** `src/modules/users/dtos/change-password.dto.ts`

```typescript
interface ChangePasswordDto {
  currentPassword: string;    // Required, must match existing
  newPassword: string;        // Required, 8+ chars, complex
  confirmPassword: string;    // Required, must match newPassword
}
```

**Validation:**
- New password must not equal current password
- New password and confirm password must match
- New password complexity same as CreateUserDto

#### 5. UserResponseDto

**File:** `src/modules/users/dtos/user-response.dto.ts`

```typescript
interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  organizationId: string;
  lastLoginAt: string;
  createdAt: Date;
  updatedAt: Date;
  // password: excluded via @Exclude()
  fullName: string;           // Computed getter
}
```

### User Service

**File:** `src/modules/users/services/users.service.ts`

#### Key Methods

```typescript
// Find all users with pagination
async findAll(page: number, limit: number)

// Find user by ID with password option
async findOne(id: string, includePassword?: boolean)

// Find user by email with password option
async findByEmail(email: string, includePassword?: boolean)

// Create new user
async create(createUserDto: CreateUserDto)

// Update user
async update(id: string, updateUserDto: UpdateUserDto)

// Delete user (soft or hard)
async remove(id: string)

// Change password with validation
async changePassword(id: string, changePasswordDto: ChangePasswordDto)

// Login with attempt tracking
async login(loginDto: LoginDto)

// Verify email with token
async verifyEmail(token: string)

// Get users by organization
async findByOrganization(organizationId: string)

// Count active users in organization
async countByOrganization(organizationId: string)
```

---

## Organization Model

### Entity: `Organization` (`src/modules/organizations/entities/organization.entity.ts`)

#### Columns

| Column | Type | Length | Nullable | Default | Description |
|--------|------|--------|----------|---------|-------------|
| `id` | UUID | - | No | auto-generated | Primary key |
| `name` | varchar | 255 | No | - | Organization name |
| `slug` | varchar | 100 | No | - | URL-friendly slug (unique) |
| `description` | text | - | Yes | null | Organization description |
| `website` | varchar | - | Yes | null | Website URL |
| `logoUrl` | varchar | - | Yes | null | Logo image URL |
| `industry` | varchar | 50 | Yes | null | Industry category |
| `totalUsers` | integer | - | No | 1 | User count |
| `status` | varchar | 50 | No | 'active' | Status (active\|inactive\|suspended\|trial) |
| `settings` | json | - | Yes | null | Custom settings object |
| `createdAt` | timestamp | - | No | CURRENT_TIMESTAMP | Creation timestamp |
| `updatedAt` | timestamp | - | No | CURRENT_TIMESTAMP | Update timestamp |

#### Relationships

```
Organization (One) ──→ User (Many)
Organization (One) ──→ Subscription (Many)
```

#### Methods

##### Settings Management

```typescript
// Get a setting value with fallback
getSettings<T>(key: string, defaultValue?: T): T
// Example: org.getSettings('maxUsers', 100)

// Set a setting value
setSetting(key: string, value: any): void
// Example: org.setSetting('theme', 'dark')
```

##### Status Checking

```typescript
// Check if organization is active
isActive(): boolean

// Check if organization is suspended
isSuspended(): boolean
```

##### Relations Navigation

```typescript
// Get active subscription (first one with status 'active')
getActiveSubscription(): Subscription | null

// Get admin user (first user with admin role)
getAdmin(): User | null
```

#### Example Usage

```typescript
// Creating organization
const org = await orgService.create({
  name: 'Acme Corp',
  slug: 'acme-corp',
  industry: 'Technology',
  website: 'https://acme.com',
});

// Managing settings
org.setSetting('maxUsers', 100);
org.setSetting('theme', 'dark');
await orgRepository.save(org);

// Getting settings
const maxUsers = org.getSettings('maxUsers', 50);
const theme = org.getSettings('theme', 'light');
```

### Organization DTOs

#### 1. CreateOrganizationDto

**File:** `src/modules/organizations/dtos/create-organization.dto.ts`

```typescript
interface CreateOrganizationDto {
  name: string;               // Required, 2-255 chars
  slug: string;               // Required, lowercase + hyphens only
  description?: string;       // Optional, 0-1000 chars
  website?: string;           // Optional, valid URL
  logoUrl?: string;           // Optional, valid URL
  industry?: string;          // Optional, 0-50 chars
  status?: OrganizationStatus; // Optional, valid enum
}
```

**Validation Rules:**
- Name: 2-255 characters
- Slug: 2-100 characters, only lowercase letters, numbers, hyphens
- Website/Logo: Valid URLs if provided
- Status: Must be valid OrganizationStatus enum

#### 2. UpdateOrganizationDto

**File:** `src/modules/organizations/dtos/update-organization.dto.ts`

```typescript
interface UpdateOrganizationDto {
  name?: string;              // Optional
  description?: string;       // Optional
  website?: string;           // Optional
  logoUrl?: string;           // Optional
  industry?: string;          // Optional
  status?: OrganizationStatus; // Optional
  settings?: Record<string, any>; // Optional, merged with existing
}
```

#### 3. OrganizationResponseDto

**File:** `src/modules/organizations/dtos/organization-response.dto.ts`

```typescript
interface OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  logoUrl: string;
  industry: string;
  totalUsers: number;
  status: OrganizationStatus;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  usersCount?: number;        // Count of users (optional)
  subscriptionsCount?: number; // Count of subscriptions (optional)
}
```

### Organization Service

**File:** `src/modules/organizations/services/organizations.service.ts`

#### Key Methods

```typescript
// Get all organizations with pagination
async findAll(page: number, limit: number)

// Get organization by ID
async findOne(id: string)

// Get organization by slug
async findBySlug(slug: string)

// Create new organization
async create(createOrgDto: CreateOrganizationDto)

// Update organization
async update(id: string, updateOrgDto: UpdateOrganizationDto)

// Delete organization
async remove(id: string)

// Get organization settings
async getSettings(id: string)

// Update organization settings (merged with existing)
async updateSettings(id: string, settings: Record<string, any>)

// Check if slug is available
async checkSlugAvailability(slug: string): Promise<boolean>

// Get organization statistics
async getStatistics(id: string)
// Returns: { totalUsers, activeUsers, totalSubscriptions, activeSubscriptions }
```

---

## Enums & Constants

### UserRole Enum

**File:** `src/common/enums/index.ts`

```typescript
enum UserRole {
  ADMIN = 'admin',    // Full access, can manage organization
  USER = 'user',      // Standard user access
  VIEWER = 'viewer',  // Read-only access
}
```

### UserStatus Enum

```typescript
enum UserStatus {
  ACTIVE = 'active',       // Active account
  INACTIVE = 'inactive',   // Inactive but not suspended
  SUSPENDED = 'suspended', // Temporarily suspended
  DELETED = 'deleted',     // Soft-deleted
}
```

### OrganizationStatus Enum

```typescript
enum OrganizationStatus {
  ACTIVE = 'active',      // Active organization
  INACTIVE = 'inactive',  // Not active
  SUSPENDED = 'suspended', // Account suspended (e.g., payment issues)
  TRIAL = 'trial',        // Trial period
}
```

---

## Common Patterns

### User Registration Flow

```typescript
// 1. Create user
const user = await usersService.create(createUserDto);

// 2. User receives verification email with token
sendVerificationEmail(user.email, user.verificationToken);

// 3. User clicks verification link
const verifiedUser = await usersService.verifyEmail(token);

// 4. User can now login
```

### Login with Account Locking

```typescript
try {
  const user = await usersService.login(loginDto);
  // Success - reset attempts
  return user;
} catch (e) {
  // Check if account is locked
  if (user.isAccountLocked()) {
    throw new UnauthorizedException('Account locked for 15 minutes');
  }
  // Failed attempt incremented automatically
}
```

### Organization Settings Pattern

```typescript
// Store arbitrary settings
org.setSetting('feature_flags', {
  darkMode: true,
  newUI: false,
  beta: true,
});

// Retrieve with defaults
const flags = org.getSettings('feature_flags', {});
const darkMode = flags.darkMode ?? false;
```

### Password Change Validation

```typescript
await usersService.changePassword(userId, changePasswordDto);
// Validates:
// - Current password matches
// - New password != confirm password (if different)
// - New password meets complexity requirements
// - New password != old password
```

---

## Security Considerations

### Password Handling
- ✅ Passwords auto-hashed with bcrypt before database insert/update
- ✅ Passwords never returned in API responses
- ✅ Password complexity enforced (uppercase, lowercase, number, special char)
- ✅ No password history stored (could be added)

### Account Security
- ✅ Login attempt tracking (max 5 attempts)
- ✅ Account auto-locking (15 minutes after 5 failed attempts)
- ✅ Email verification tokens for signup
- ✅ Last login tracking for audit
- ✅ Account activation status

### Data Protection
- ✅ UUID primary keys prevent ID enumeration
- ✅ Unique constraints on email and slug
- ✅ Foreign key constraints with CASCADE delete
- ✅ Soft-delete support via status field
- ✅ Audit logging integration ready

### Performance
- ✅ Indexes on frequently queried columns (email, slug)
- ✅ Select: false on sensitive fields (password, token)
- ✅ Pagination support for large datasets
- ✅ Lazy-loading of relationships

---

## Database Migrations

### Initial Schema
**File:** `src/migrations/1704067200000-InitialSchema.ts`
- Creates users and organizations tables
- Sets up indexes and constraints

### User Security Columns
**File:** `src/migrations/1704067200001-AddUserSecurityColumns.ts`
- Adds loginAttempts and lockUntil columns

---

## Testing

### User Service Tests

```typescript
describe('UsersService', () => {
  describe('create', () => {
    it('should create a new user with hashed password');
    it('should throw ConflictException if email exists');
    it('should generate verification token');
  });

  describe('login', () => {
    it('should return user on valid credentials');
    it('should throw UnauthorizedException on invalid credentials');
    it('should increment login attempts on failed login');
    it('should lock account after 5 failed attempts');
    it('should reset attempts on successful login');
  });

  describe('changePassword', () => {
    it('should change password if current password valid');
    it('should throw if current password incorrect');
    it('should throw if new passwords do not match');
  });
});
```

---

## Next Steps

1. **JWT Integration**
   - Implement JWT token generation in login
   - Create auth guards for protected routes
   - Add token refresh mechanism

2. **Email Service**
   - Send verification emails
   - Send password reset emails
   - Send notification emails

3. **Audit Logging**
   - Log user creation/updates/deletion
   - Log login attempts
   - Log organization changes

4. **API Documentation**
   - Add Swagger/OpenAPI annotations
   - Generate interactive API docs
   - Add endpoint examples

5. **Advanced Features**
   - Two-factor authentication (2FA)
   - Password reset via email
   - Social login integration
   - Role-based access control (RBAC)

---

**Status**: ✅ Models Complete & Production Ready
**Last Updated**: 2024
**Dependencies**: TypeORM, NestJS, bcrypt, class-validator
