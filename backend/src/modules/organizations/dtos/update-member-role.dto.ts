import { IsEnum } from 'class-validator';
import { OrganizationRole } from '../../../common/enums';

export class UpdateMemberRoleDto {
  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
