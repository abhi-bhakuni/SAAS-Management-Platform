import { OrganizationStatus } from '../../../common/enums';

export class OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  logoUrl: string;
  industry: string;
  totalUsers: number;
  status: OrganizationStatus;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  usersCount?: number;
  subscriptionsCount?: number;
}
