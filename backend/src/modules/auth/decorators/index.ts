import { createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { OrganizationRole } from '../../../common/enums';
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
 */
export const Roles = (...roles: OrganizationRole[]) => {
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
 * Role hierarchy: ADMIN > MANAGER > MEMBER
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
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Mark route as requiring organization membership
 */
export const OrgRequired = (paramName: string = 'orgId') =>
  SetMetadata('orgRequired', paramName);
