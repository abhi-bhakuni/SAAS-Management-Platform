import { io, Socket } from 'socket.io-client';
// import type { Task, TaskStatus } from '../types/task';

interface ActivityEvent {
  id: string;
  type: 'task_moved' | 'task_assigned' | 'task_created' | 'task_updated' | 'task_deleted';
  message: string;
  userId: string;
  userName: string;
  projectId: string;
  orgId: string;
  taskId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

interface TaskUpdateEvent {
  taskId: string;
  projectId: string;
  orgId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned';
  data: any;
  userId: string;
  timestamp: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event listeners
  private taskUpdateListeners: ((event: TaskUpdateEvent) => void)[] = [];
  private activityListeners: ((event: ActivityEvent) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  connect(orgId: string, projectId: string, userId: string) {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }

    const token = localStorage.getItem('authToken');

    this.socket = io('http://localhost:3000/tasks', {
      query: {
        orgId,
        projectId,
        userId,
      },
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.reconnectAttempts = 0;
      this.connectionListeners.forEach(listener => listener(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.connectionListeners.forEach(listener => listener(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Listen for task updates
    this.socket.on('task_update', (event: TaskUpdateEvent) => {
      console.log('Task update received:', event);
      this.taskUpdateListeners.forEach(listener => listener(event));
    });

    // Listen for activity events
    this.socket.on('activity', (event: ActivityEvent) => {
      console.log('Activity event received:', event);
      this.activityListeners.forEach(listener => listener(event));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket.connect();
        }
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  // Join a specific project room
  joinProject(orgId: string, projectId: string) {
    if (this.socket) {
      this.socket.emit('join_project', { orgId, projectId });
    }
  }

  // Leave a project room
  leaveProject(orgId: string, projectId: string) {
    if (this.socket) {
      this.socket.emit('leave_project', { orgId, projectId });
    }
  }

  // Event listener management
  onTaskUpdate(listener: (event: TaskUpdateEvent) => void) {
    this.taskUpdateListeners.push(listener);
    return () => {
      this.taskUpdateListeners = this.taskUpdateListeners.filter(l => l !== listener);
    };
  }

  onActivity(listener: (event: ActivityEvent) => void) {
    this.activityListeners.push(listener);
    return () => {
      this.activityListeners = this.activityListeners.filter(l => l !== listener);
    };
  }

  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  // Check connection status
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export type { ActivityEvent, TaskUpdateEvent };