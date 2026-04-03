import { createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { UserRole, OrganizationRole } from '../../../common/enums';
import { RolesGuard } from '../guards/roles.guard';
import { OrgRoleGuard } from '../guards/org-role.guard';

/**
 * Extract current user from request.user (set by JWT strategy)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Extract current user's organization ID from JWT (workspace context)
 */
export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.selectedOrgId;
  },
);

/**
 * Mark required global user roles for a route (used with RolesGuard)
 * Checks role from JWT against required roles
 *
 * Example: @Roles(UserRole.ADMIN) - only admins can access
 */
export const Roles = (...roles: UserRole[]) => {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (key && descriptor) {
      SetMetadata('roles', roles)(target, key, descriptor);
      UseGuards(RolesGuard)(target, key, descriptor);
    }
    return descriptor;
  };
};

/**
 * Mark required organization roles for a route (used with OrgRoleGuard)
 * Checks orgRole from JWT against required roles
 * Role hierarchy: OWNER > ADMIN > MEMBER
 *
 * Example: @OrgRoles(OrganizationRole.ADMIN) - allows OWNER and ADMIN
 */
export const OrgRoles = (...roles: OrganizationRole[]) => {
  return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (key && descriptor) {
      SetMetadata('orgRoles', roles)(target, key, descriptor);
      UseGuards(OrgRoleGuard)(target, key, descriptor);
    }
    return descriptor;
  };
};

/**
 * Mark a route as public (no authentication required)
 * Useful for marking routes that skip JWT validation
 * Used with global JwtAuthGuard
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Mark route as requiring organization membership
 * Validates user belongs to specified organization
 * @param paramName - Name of route param containing orgId (default: 'orgId')
 *
 * Example: @OrgRequired() on route like /organizations/:orgId/users
 */
export const OrgRequired = (paramName: string = 'orgId') =>
  SetMetadata('orgRequired', paramName);
