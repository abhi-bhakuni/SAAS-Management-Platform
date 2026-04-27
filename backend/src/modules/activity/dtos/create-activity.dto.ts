import { IsEnum, IsNotEmpty, IsOptional, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateActivityDto {
  @IsEnum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'] as const)
  action!: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';

  @IsString()
  @IsNotEmpty()
  entityType!: string;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsObject()
  description?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
