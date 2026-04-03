import { ProjectStatus } from '../../../common/enums';

export class ProjectResponseDto {
  id: string;
  organizationId: string;
  createdByUserId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
