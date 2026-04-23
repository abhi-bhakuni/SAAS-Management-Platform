export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedToUserId?: string;
  assignedTo?: User;
  createdByUserId: string;
  createdBy: User;
  dueDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  project?: string;
  projectName?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToUserId?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToUserId?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
}