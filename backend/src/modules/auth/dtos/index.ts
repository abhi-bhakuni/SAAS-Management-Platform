import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole, OrganizationRole } from '../../../common/enums';
import { Transform } from 'class-transformer';

/**
 * Login DTO for POST /auth/login
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

/**
 * Signup DTO for POST /auth/register
 */
export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.ADMIN;
}

/**
 * Switch workspace DTO for POST /auth/switch-workspace
 */
export class SwitchWorkspaceDto {
  @Transform(({ value }) => {
    return typeof value === 'string' ? `org_${value.replace(/-/g, '')}` : `org_${value}`;
  })
  @IsUUID()
  organizationId: string;
}

/**
 * Switch workspace response DTO
 */
export class SwitchWorkspaceResponseDto {
  access_token: string;
  selectedOrgId: string;
  selectedOrgRole: OrganizationRole;
}

/**
 * Organization info in user response
 */
export class OrganizationInfoDto {
  id: string;
  name: string;
  role: OrganizationRole;
}

/**
 * User data returned in auth responses
 */
export class AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole; // Global role
  organizations: OrganizationInfoDto[];
  selectedOrgId?: string;
  selectedOrgRole?: OrganizationRole;
}

/**
 * Auth response DTO for login/register endpoints
 */
export class AuthResponseDto {
  access_token: string;
  user: AuthUserDto;
  expiresIn: number;
}

/**
 * JWT payload structure
 */
export class JwtPayloadDto {
  sub: string; // User ID
  email: string;
  role: UserRole; // Global role
  selectedOrgId: string; // Currently active workspace
  orgRole: OrganizationRole; // Role within selectedOrgId
  iat: number;
  exp: number;
}

/**
 * Refresh token DTO (placeholder for future implementation)
 */
export class RefreshTokenDto {
  refresh_token: string;
}
