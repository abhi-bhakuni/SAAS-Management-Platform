import axios from 'axios';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

const API_BASE_URL = 'http://localhost:3000'; // Adjust if backend is on different port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token if available
const token = localStorage.getItem('authToken');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const taskApi = {
  // Get all tasks for a project
  getTasks: async (orgId: string, projectId: string): Promise<Task[]> => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks`);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (
    orgId: string,
    projectId: string,
    taskId: string,
    status: string
  ): Promise<Task> => {
    const response = await api.patch(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/status`,
      { status }
    );
    return response.data;
  },

  // Create task
  createTask: async (
    orgId: string,
    projectId: string,
    taskData: CreateTaskDto
  ): Promise<Task> => {
    const response = await api.post(
      `/organizations/${orgId}/projects/${projectId}/tasks`,
      taskData
    );
    return response.data;
  },

  // Update task
  updateTask: async (
    orgId: string,
    projectId: string,
    taskId: string,
    taskData: UpdateTaskDto
  ): Promise<Task> => {
    const response = await api.put(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      taskData
    );
    return response.data;
  },

  // Delete task
  deleteTask: async (orgId: string, projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`);
  },
};

export default api;