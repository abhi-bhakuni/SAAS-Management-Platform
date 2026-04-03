import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface TaskUpdateEvent {
  taskId: string;
  projectId: string;
  orgId: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned';
  data: any;
  userId: string;
  timestamp: Date;
}

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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/tasks',
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TasksGateway');
  private connectedClients: Map<string, { orgId: string; projectId: string; userId: string }> = new Map();

  handleConnection(client: Socket) {
    const { orgId, projectId, userId } = client.handshake.query as any;

    if (orgId && projectId && userId) {
      const roomKey = `${orgId}:${projectId}`;
      client.join(roomKey);
      this.connectedClients.set(client.id, { orgId, projectId, userId });

      this.logger.log(`Client ${client.id} connected to room ${roomKey}`);
    } else {
      this.logger.warn(`Client ${client.id} connected without proper credentials`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_project')
  handleJoinProject(
    @MessageBody() data: { orgId: string; projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomKey = `${data.orgId}:${data.projectId}`;
    client.join(roomKey);
    this.logger.log(`Client ${client.id} joined project room ${roomKey}`);
  }

  @SubscribeMessage('leave_project')
  handleLeaveProject(
    @MessageBody() data: { orgId: string; projectId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomKey = `${data.orgId}:${data.projectId}`;
    client.leave(roomKey);
    this.logger.log(`Client ${client.id} left project room ${roomKey}`);
  }

  // Emit task updates to all clients in the project room
  emitTaskUpdate(event: TaskUpdateEvent) {
    const roomKey = `${event.orgId}:${event.projectId}`;
    this.server.to(roomKey).emit('task_update', event);
    this.logger.log(`Emitted task update for project ${roomKey}: ${event.action}`);
  }

  // Emit activity events to all clients in the project room
  emitActivityEvent(event: ActivityEvent) {
    const roomKey = `${event.orgId}:${event.projectId}`;
    this.server.to(roomKey).emit('activity', event);
    this.logger.log(`Emitted activity event for project ${roomKey}: ${event.type}`);
  }

  // Broadcast task status change
  broadcastTaskStatusChange(
    orgId: string,
    projectId: string,
    taskId: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    userName: string,
  ) {
    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random()}`,
      type: 'task_moved',
      message: `Task moved from ${oldStatus} to ${newStatus}`,
      userId,
      userName,
      projectId,
      orgId,
      taskId,
      oldValue: oldStatus,
      newValue: newStatus,
      timestamp: new Date(),
    };

    this.emitActivityEvent(activityEvent);
  }

  // Broadcast task assignment
  broadcastTaskAssignment(
    orgId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    oldAssigneeId: string | null,
    newAssigneeId: string,
    newAssigneeName: string,
    userId: string,
    userName: string,
  ) {
    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random()}`,
      type: 'task_assigned',
      message: oldAssigneeId
        ? `Task "${taskTitle}" reassigned to ${newAssigneeName}`
        : `Task "${taskTitle}" assigned to ${newAssigneeName}`,
      userId,
      userName,
      projectId,
      orgId,
      taskId,
      oldValue: oldAssigneeId,
      newValue: newAssigneeId,
      timestamp: new Date(),
    };

    this.emitActivityEvent(activityEvent);
  }

  // Broadcast task creation
  broadcastTaskCreated(
    orgId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    userId: string,
    userName: string,
  ) {
    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random()}`,
      type: 'task_created',
      message: `Task "${taskTitle}" created`,
      userId,
      userName,
      projectId,
      orgId,
      taskId,
      timestamp: new Date(),
    };

    this.emitActivityEvent(activityEvent);
  }

  // Broadcast task update
  broadcastTaskUpdated(
    orgId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    userId: string,
    userName: string,
  ) {
    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random()}`,
      type: 'task_updated',
      message: `Task "${taskTitle}" updated`,
      userId,
      userName,
      projectId,
      orgId,
      taskId,
      timestamp: new Date(),
    };

    this.emitActivityEvent(activityEvent);
  }

  // Broadcast task deletion
  broadcastTaskDeleted(
    orgId: string,
    projectId: string,
    taskId: string,
    taskTitle: string,
    userId: string,
    userName: string,
  ) {
    const activityEvent: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random()}`,
      type: 'task_deleted',
      message: `Task "${taskTitle}" deleted`,
      userId,
      userName,
      projectId,
      orgId,
      taskId,
      timestamp: new Date(),
    };

    this.emitActivityEvent(activityEvent);
  }
}