import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRole } from '../../../common/enums';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // System ADMIN always has access regardless of org role
    if (user.role === OrganizationRole.ADMIN) {
      return true;
    }

    // Get required roles from metadata (set by @OrgRoles() decorator)
    const requiredRoles = this.reflector.get<OrganizationRole[]>(
      'orgRoles',
      context.getHandler(),
    );

    // If no specific roles required, allow all members
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if user's org role matches required roles
    const userOrgRole = user.orgRole;

    if (!this.hasRequiredOrgRole(userOrgRole, requiredRoles)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}. Your current role: ${userOrgRole}`,
      );
    }

    return true;
  }

  /**
   * Check if user's role is sufficient for the required roles
   * Role hierarchy: ADMIN > MANAGER > MEMBER
   */
  private hasRequiredOrgRole(
    userRole: OrganizationRole,
    requiredRoles: OrganizationRole[],
  ): boolean {
    const roleHierarchy = {
      [OrganizationRole.ADMIN]: 3,
      [OrganizationRole.MANAGER]: 2,
      [OrganizationRole.MEMBER]: 1,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const minRequired = Math.max(...requiredRoles.map((r) => roleHierarchy[r] || 0));

    return userLevel >= minRequired;
  }
}
