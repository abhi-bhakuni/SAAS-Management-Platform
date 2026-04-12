import axios from 'axios';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

const API_BASE_URL = 'http://localhost:3000'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to determine if we are in sandbox mode
const isSandboxMode = () => !localStorage.getItem('authToken');

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
      const hadToken = !!localStorage.getItem('authToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      if (hadToken && window.location.pathname !== '/login') {
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
    if (isSandboxMode()) return { id: 'guest', name: 'Guest User', role: 'GUEST' };
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async (orgId?: string) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/dashboard');
      return response.data;
    }
    const response = await api.get(`/organizations/${orgId}/dashboard-stats`);
    return response.data;
  }
};

export const projectsApi = {
  getProjects: async (orgId?: string) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/projects');
      return response.data;
    }
    const response = await api.get(`/organizations/${orgId}/projects`);
    return response.data;
  },
  createProject: async (orgId: string, data: any) => {
    if (isSandboxMode()) throw new Error('Cannot create projects in Sandbox mode.');
    const response = await api.post(`/organizations/${orgId}/projects`, data);
    return response.data;
  }
};

export const taskApi = {
  getTasks: async (orgId?: string, projectId?: string): Promise<Task[]> => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/tasks');
      return response.data;
    }
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks`);
    return response.data;
  },
  updateTaskStatus: async (orgId: string, projectId: string, taskId: string, status: string): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.patch(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/status`,
      { status }
    );
    return response.data;
  },
  createTask: async (orgId: string, projectId: string, taskData: CreateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.post(
      `/organizations/${orgId}/projects/${projectId}/tasks`,
      taskData
    );
    return response.data;
  },
  updateTask: async (orgId: string, projectId: string, taskId: string, taskData: UpdateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.put(
      `/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`,
      taskData
    );
    return response.data;
  },
  deleteTask: async (orgId: string, projectId: string, taskId: string): Promise<void> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    await api.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`);
  },
  getAssignableUsers: async (orgId: string, projectId: string): Promise<any[]> => {
    if (isSandboxMode()) return [{ id: 'u1', name: 'Abhishek B.' }, { id: 'u2', name: 'Sarah M.' }];
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks/assignable-users`);
    return response.data;
  },
};

export const activityApi = {
  getActivity: async (orgId?: string, projectId?: string) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/activity');
      return response.data;
    }
    const response = await api.get(`/organizations/${orgId}/activity`);
    return response.data;
  }
};

export default api;