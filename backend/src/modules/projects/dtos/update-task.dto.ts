import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../../../common/enums';
import { Transform } from 'class-transformer';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @Transform(({ value }) => {
    return typeof value === 'string' ? `user_${value.replace(/-/g, '')}` : `user_${value}`;
  })
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
