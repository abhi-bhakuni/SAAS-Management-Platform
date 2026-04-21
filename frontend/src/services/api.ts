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

// Request interceptor to attach token dynamically and inject selected org ID header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const userString = localStorage.getItem('user');
  if (userString && config.headers) {
    try {
      const user = JSON.parse(userString);
      if (user?.selectedOrgId) {
        config.headers['x-org-id'] = user.selectedOrgId;
      }
    } catch {
      // ignore invalid user payload
    }
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

export const organizationApi = {
  getMembers: async (page = 1, limit = 50) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/members', {
        params: { page, limit },
      });
      return response.data;
    }

    const response = await api.get('/organizations/members', {
      params: { page, limit },
    });
    return response.data;
  },
};

export const billingApi = {
  getMySubscription: async () => {
    if (isSandboxMode()) {
      return { subscription: null, paymentMethod: null };
    }

    const response = await api.get('/subscriptions/me');
    return response.data;
  },
};

export const projectsApi = {
  getProjects: async () => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/projects');
      return response.data;
    }
    const response = await api.get(`/projects`);
    return response.data;
  },
  createProject: async (data: any) => {
    if (isSandboxMode()) throw new Error('Cannot create projects in Sandbox mode.');
    const response = await api.post(`/projects`, data);
    return response.data;
  }
};

export const taskApi = {
  getTasks: async (projectId?: string): Promise<Task[]> => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/tasks');
      return response.data;
    }
    const response = await api.get(`/tasks`, {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },
  updateTaskStatus: async (projectId: string, taskId: string, status: string): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.patch(
      `/tasks/${projectId}/${taskId}/status`,
      { status }
    );
    return response.data;
  },
  createTask: async (projectId: string, taskData: CreateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.post(
      `/tasks/${projectId}`,
      taskData
    );
    return response.data;
  },
  updateTask: async (projectId: string, taskId: string, taskData: UpdateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.put(
      `/tasks/${projectId}/${taskId}`,
      taskData
    );
    return response.data;
  },
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    await api.delete(`/tasks/${projectId}/${taskId}`);
  },
  getAssignableUsers: async (projectId: string): Promise<any[]> => {
    if (isSandboxMode()) return [{ id: 'u1', name: 'Abhishek B.' }, { id: 'u2', name: 'Sarah M.' }];
    const response = await api.get(`/tasks/assignable-users`, {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },
};

export const activityApi = {
  getActivity: async () => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/activity');
      return response.data;
    }
    const response = await api.get(`/activity`);
    return response.data;
  }
};

export default api;