import { Transform } from 'class-transformer';
import { IsUUID, IsOptional } from 'class-validator';

export class AssignTaskDto {
  @Transform(({ value }) => {
    return typeof value === 'string' ? `user_${value.replace(/-/g, '')}` : `user_${value}`;
  })
  @IsUUID()
  assignedToUserId: string;

  @IsOptional()
  note?: string; // Optional note when assigning
}
