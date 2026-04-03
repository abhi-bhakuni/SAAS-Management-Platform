import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../../common/enums';

@Injectable()
export class OrgAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only ADMIN users or org-level admins can access
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only organization administrators can perform this action',
      );
    }

    return true;
  }
}
