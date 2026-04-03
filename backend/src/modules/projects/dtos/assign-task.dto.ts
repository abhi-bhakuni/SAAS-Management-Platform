import { IsUUID, IsOptional } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  assignedToUserId: string;

  @IsOptional()
  note?: string; // Optional note when assigning
}
