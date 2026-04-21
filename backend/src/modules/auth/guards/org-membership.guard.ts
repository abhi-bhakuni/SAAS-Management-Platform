import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums';

@Injectable()
export class OrgMembershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // System ADMIN always has access to any organization
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Extract organization ID from headers first, then route params/query/body.
    const requestedOrgId =
      request.headers['x-org-id'] ||
      request.headers['org-id'] ||
      request.headers['orgid'] ||
      request.params.orgId ||
      request.query.orgId ||
      request.body?.organizationId;

    // If no specific org is requested, use the user's current workspace from JWT.
    // This handles cases where the endpoint doesn't have orgId in the route.
    const orgIdToCheck = requestedOrgId || user.selectedOrgId;

    // Validate that user's current workspace (from JWT) matches the requested org
    // The JWT selectedOrgId is the authoritative source of truth
    if (!orgIdToCheck || user.selectedOrgId !== orgIdToCheck) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization than your current workspace',
      );
    }

    return true;
  }
}

