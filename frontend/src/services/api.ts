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
      if (user?.id) {
        config.headers['x-org-user-id'] = user.id;
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
  acceptInvite: async (data: { token: string; firstName: string; lastName: string; password: string }) => {
    const response = await api.post('/auth/accept-invite', data);
    return response.data;
  },
  getCurrentUser: async () => {
    if (isSandboxMode()) return { id: 'guest', name: 'Guest User', role: 'GUEST' };
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (userId: string, data: { firstName?: string; lastName?: string; bio?: string }) => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async () => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/dashboard');
      return response.data;
    }
    const response = await api.get('/organizations/dashboard-stats');
    return response.data;
  },
};

export const organizationApi = {
  getMembers: async (page = 1, limit = 50) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/members', { params: { page, limit } });
      return response.data;
    }

    const response = await api.get('/organizations/members', {
      params: { page, limit },
    });
    return response.data;
  },
  createInvite: async (
    data: { email: string; role?: 'ADMIN' | 'MANAGER' | 'MEMBER' },
  ) => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.post('/organizations/invites', data);
    return response.data;
  },
  getInvites: async (
    params?: { status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'; page?: number; limit?: number },
  ) => {
    if (isSandboxMode()) return { data: [], total: 0, page: 1, limit: params?.limit ?? 20, pages: 0 };
    const response = await api.get('/organizations/invites', { params });
    return response.data;
  },
  revokeInvite: async (inviteId: string) => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.delete(`/organizations/invites/${inviteId}`);
    return response.data;
  },
  updateMemberRole: async (userId: string, role: 'ADMIN' | 'MANAGER' | 'MEMBER') => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.put(`/organizations/members/${userId}`, { role });
    return response.data;
  },
  removeMember: async (userId: string) => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.delete(`/organizations/members/${userId}`);
    return response.data;
  },
};

export const billingApi = {
  getMySubscription: async () => {
    if (isSandboxMode()) return { subscription: null, paymentMethod: null };
    const response = await api.get('/subscriptions/me');
    return response.data;
  },

  getPlans: async () => {
    if (isSandboxMode()) return { plans: [] };
    const response = await api.get('/subscriptions/plans');
    return response.data; // { plans: SubscriptionPlan[] }
  },

  // Creates a Stripe Checkout session and returns { url, sessionId }.
  // Redirect the browser to `url` to send the user to Stripe's hosted payment page.
  createCheckoutSession: async (planId: string) => {
    if (isSandboxMode()) throw new Error('Checkout is not available in Sandbox mode.');
    const response = await api.post('/subscriptions/create-checkout-session', { planId });
    return response.data as { url: string; sessionId: string };
  },

  // Creates a Stripe Billing Portal session and returns { url }.
  // Redirect the browser to `url` so the user can manage/cancel their subscription.
  createPortalSession: async () => {
    if (isSandboxMode()) throw new Error('Billing portal is not available in Sandbox mode.');
    const response = await api.post('/subscriptions/create-portal-session', {});
    return response.data as { url: string };
  },

  // Syncs a subscription record from a completed Checkout session (handles missed webhooks).
  syncCheckoutSession: async (sessionId: string) => {
    const response = await api.post('/subscriptions/sync-checkout-session', { sessionId });
    return response.data as { synced: boolean };
  },

  cancelSubscription: async () => {
    const response = await api.post('/subscriptions/cancel', {});
    return response.data;
  },
};

export const projectsApi = {
  getProjects: async () => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/projects');
      return response.data;
    }
    const response = await api.get('/projects');
    return response.data;
  },
  createProject: async (data: any) => {
    if (isSandboxMode()) throw new Error('Cannot create projects in Sandbox mode.');
    const response = await api.post(`/projects`, data);
    return response.data;
  },
  deleteProject: async (projectId: string) => {
    if (isSandboxMode()) throw new Error('Cannot delete projects in Sandbox mode.');
    const response = await api.delete(`/projects/${projectId}`);
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
      `/tasks/${taskId}/status`,
      { status },
      { params: { projectId } }
    );
    return response.data;
  },
  createTask: async (projectId: string, taskData: CreateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.post(
      `/tasks`,
      taskData,
      { params: { projectId } }
    );
    return response.data;
  },
  updateTask: async (projectId: string, taskId: string, taskData: UpdateTaskDto): Promise<Task> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    const response = await api.put(
      `/tasks/${taskId}`,
      taskData,
      { params: { projectId } }
    );
    return response.data;
  },
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    if (isSandboxMode()) throw new Error('Modifications restricted in Sandbox.');
    await api.delete(
      `/tasks/${taskId}`,
      { params: { projectId } }
    );
  },
  getAssignableUsers: async (projectId: string): Promise<any[]> => {
    if (isSandboxMode()) return [];
    const response = await api.get(`/tasks/assignable-users`, {
      params: projectId ? { projectId } : undefined,
    });
    return response.data;
  },
};

export const activityApi = {
  getActivity: async (projectId?: string) => {
    if (isSandboxMode()) {
      const response = await api.get('/sandbox/activity');
      return response.data;
    }
    const response = await api.get('/activity', { params: projectId ? { projectId } : undefined });
    return response.data;
  }
};

export const passwordApi = {
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export const securityApi = {
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  getLoginActivity: async () => {
    const response = await api.get('/auth/login-activity');
    return response.data as { id: string; ipAddress: string; userAgent: string; createdAt: string }[];
  },
  generate2FA: async () => {
    const response = await api.post('/auth/2fa/generate');
    return response.data as { qrCodeUrl: string; secret: string };
  },
  enable2FA: async (token: string) => {
    const response = await api.post('/auth/2fa/enable', { token });
    return response.data as { enabled: boolean };
  },
  disable2FA: async (token: string) => {
    const response = await api.post('/auth/2fa/disable', { token });
    return response.data as { enabled: boolean };
  },
  closeOrganization: async () => {
    const response = await api.delete('/auth/close-organization');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/delete-account');
    return response.data;
  },
};

export const chatApi = {
  getMyConversation: async () => {
    const response = await api.get('/chat/conversation');
    return response.data as { conversation: any; messages: any[] };
  },
  ensureConversation: async () => {
    const response = await api.post('/chat/conversation');
    return response.data as { conversationId: string };
  },
  getAllConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data as { conversations: any[] };
  },
  getMessages: async (conversationId: string) => {
    const response = await api.get(`/chat/messages/${conversationId}`);
    return response.data as { messages: any[] };
  },
};

export default api;