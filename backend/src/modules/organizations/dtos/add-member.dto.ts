import { IsUUID, IsEnum } from 'class-validator';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(OrganizationRole)
  role?: OrganizationRole;
}
