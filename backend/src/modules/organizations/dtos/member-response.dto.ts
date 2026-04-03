import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';

export class UserInfoDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class MemberResponseDto {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: Date;
  user?: UserInfoDto;
}
