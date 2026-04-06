import axios from 'axios';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

const API_BASE_URL = 'http://localhost:3000'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const projectsApi = {
  getProjects: async (orgId: string) => {
    const response = await api.get(`/organizations/${orgId}/projects`);
    return response.data;
  },
  createProject: async (orgId: string, data: any) => {
    const response = await api.post(`/organizations/${orgId}/projects`, data);
    return response.data;
  }
};

export const taskApi = {
  getTasks: async (orgId: string, projectId: string): Promise<Task[]> => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks`);
    return response.data;
  },
  updateTaskStatus: async (orgId: string, projectId: string, taskId: string, status: string): Promise<Task> => {
    const response = await api.patch(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/status`,
      { status }
    );
    return response.data;
  },
  createTask: async (orgId: string, projectId: string, taskData: CreateTaskDto): Promise<Task> => {
    const response = await api.post(
      `/organizations/${orgId}/projects/${projectId}/tasks`,
      taskData
    );
    return response.data;
  },
  updateTask: async (orgId: string, projectId: string, taskId: string, taskData: UpdateTaskDto): Promise<Task> => {
    const response = await api.put(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      taskData
    );
    return response.data;
  },
  deleteTask: async (orgId: string, projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`);
  },
  getAssignableUsers: async (orgId: string, projectId: string): Promise<any[]> => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks/assignable-users`);
    return response.data;
  },
};

export default api;