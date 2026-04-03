import { IsEnum } from 'class-validator';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';

export class UpdateMemberRoleDto {
  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
