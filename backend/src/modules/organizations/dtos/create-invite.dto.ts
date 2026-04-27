import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrganizationRole } from '../../../common/enums';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole = OrganizationRole.MEMBER;
}
