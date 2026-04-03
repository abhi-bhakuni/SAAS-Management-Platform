import { IsEnum, IsOptional, MaxLength } from 'class-validator';
import { TaskStatus } from '../../../common/enums';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
