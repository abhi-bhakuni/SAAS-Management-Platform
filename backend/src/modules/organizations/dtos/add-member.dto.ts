import { IsUUID, IsEnum } from 'class-validator';
import { OrganizationRole } from '../../../common/enums';
import { Transform } from 'class-transformer';

export class AddMemberDto {
  @Transform(({ value }) => {
    return typeof value === 'string' ? `user_${value.replace(/-/g, '')}` : `user_${value}`;
  })
  @IsUUID()
  userId: string;

  @IsEnum(OrganizationRole)
  role?: OrganizationRole;
}
