import { TaskStatus, TaskPriority } from '../../../common/enums';

export class TaskResponseDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId: string | null;
  createdByUserId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
