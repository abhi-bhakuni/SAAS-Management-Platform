import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationRole } from '../../../common/enums';

@Injectable()
export class OrgAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only ADMIN users can access
    if (user.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenException(
        'Only organization administrators can perform this action',
      );
    }

    return true;
  }
}
