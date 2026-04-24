import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums';

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName?: string;
  bio?: string;

  @Exclude()
  password!: string;

  role!: UserRole;
  emailVerified!: boolean;
  isActive!: boolean;
  organizationId!: string;
  lastLoginAt!: string;
  createdAt!: Date;
  updatedAt!: Date;

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
}
