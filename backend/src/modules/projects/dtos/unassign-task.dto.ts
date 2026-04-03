import { IsOptional } from 'class-validator';

export class UnassignTaskDto {
  @IsOptional()
  note?: string; // Optional note when unassigning
}
