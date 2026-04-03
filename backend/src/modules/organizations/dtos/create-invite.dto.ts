import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.MEMBER;
}
