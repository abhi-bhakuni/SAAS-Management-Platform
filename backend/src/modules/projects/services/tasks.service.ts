import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { TaskStatusHistory } from '../entities/task-status-history.entity';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import { TasksGateway } from '../../websocket/tasks.gateway';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from '../dtos';
import { TaskStatus } from '../../../common/enums';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(TaskStatusHistory)
    private readonly statusHistoryRepository: Repository<TaskStatusHistory>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
    private readonly tasksGateway: TasksGateway,
  ) {}

  /**
   * List all tasks within a project (paginated).
   */
  async findAll(projectId: string, page = 1, limit = 20) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { projectId },
      relations: ['assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: tasks.map((t) => this.toResponse(t)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single task by ID, ensuring it belongs to the project.
   */
  async findOne(projectId: string, taskId: string) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
      relations: ['assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    return this.toResponse(task);
  }

  /**
   * Create a new task scoped to the project.
   */
  async create(
    projectId: string,
    createdByUserId: string,
    dto: CreateTaskDto,
  ) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = this.taskRepository.create({
      ...dto,
      projectId,
      createdByUserId,
    });

    const saved = await this.taskRepository.save(task);

    // Emit real-time event
    this.tasksGateway.broadcastTaskCreated(
      project.organizationId,
      projectId,
      saved.id,
      saved.title,
      createdByUserId,
      'User', // TODO: Get actual user name
    );

    // Re-fetch with relations so the response is complete
    return this.findOne(projectId, saved.id);
  }

  /**
   * Update an existing task. Validates it belongs to the project.
   */
  async update(
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    updatedByUserId?: string,
  ) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    Object.assign(task, dto);
    await this.taskRepository.save(task);

    // Emit real-time event if user ID provided
    if (updatedByUserId) {
      this.tasksGateway.broadcastTaskUpdated(
        project.organizationId,
        projectId,
        taskId,
        task.title,
        updatedByUserId,
        'User', // TODO: Get actual user name
      );
    }

    return this.findOne(projectId, taskId);
  }

  /**
   * Permanently delete a task. Validates it belongs to the project.
   */
  async remove(projectId: string, taskId: string) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    await this.taskRepository.remove(task);
    return { message: 'Task deleted successfully' };
  }

  /**
   * Get tasks by status within a project.
   */
  async findByStatus(
    projectId: string,
    status: string,
    page = 1,
    limit = 20,
  ) {
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { projectId, status: status as any },
      relations: ['assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: tasks.map((t) => this.toResponse(t)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get tasks assigned to a user within a project.
   */
  async findByAssignee(
    projectId: string,
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { projectId, assignedToUserId: userId },
      relations: ['assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: tasks.map((t) => this.toResponse(t)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Assign a task to a user. Validates user is in the same organization as the project.
   */
  async assignUser(projectId: string, taskId: string, userId: string, assignedByUserId?: string) {
    // Fetch project with organization
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['organization'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Fetch task
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    // Validate user is a member of the organization
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        `User with ID ${userId} is not a member of organization ${project.organizationId}`,
      );
    }

    // Update task assignment
    const oldAssigneeId = task.assignedToUserId;
    task.assignedToUserId = userId;
    await this.taskRepository.save(task);

    // Emit real-time event if assigned by someone
    if (assignedByUserId) {
      this.tasksGateway.broadcastTaskAssignment(
        project.organizationId,
        projectId,
        taskId,
        task.title,
        oldAssigneeId,
        userId,
        'User', // TODO: Get actual assignee name
        assignedByUserId,
        'User', // TODO: Get actual assigner name
      );
    }

    return this.findOne(projectId, taskId);
  }

  /**
   * Unassign a task from its current assignee.
   */
  async unassignUser(projectId: string, taskId: string) {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Fetch task
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    if (!task.assignedToUserId) {
      throw new BadRequestException(
        `Task with ID ${taskId} is not currently assigned to any user`,
      );
    }

    // Update task to remove assignment
    task.assignedToUserId = null;
    await this.taskRepository.save(task);

    return this.findOne(projectId, taskId);
  }

  /**
   * Get all organization members who can be assigned to tasks in a project.
   */
  async getAssignableUsers(projectId: string) {
    // Fetch project with organization
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['organization'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Get all members of the organization
    const members = await this.membershipRepository.find({
      where: { organizationId: project.organizationId },
      relations: ['user'],
      order: { user: { firstName: 'ASC' } },
    });

    return members.map((m) => ({
      userId: m.userId,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      role: m.role,
    }));
  }

  /**
   * Update task status and create history record.
   */
  async updateStatus(
    projectId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskStatusDto,
  ) {
    // Verify project and task exist
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    // Prevent same status update
    if (task.status === dto.status) {
      throw new BadRequestException(
        `Task is already in ${dto.status} status`,
      );
    }

    // Create status history record
    const statusHistory = this.statusHistoryRepository.create({
      taskId,
      fromStatus: task.status,
      toStatus: dto.status,
      changedByUserId: userId,
      reason: dto.reason,
    });

    await this.statusHistoryRepository.save(statusHistory);

    // Update task status
    const oldStatus = task.status;
    task.status = dto.status;
    await this.taskRepository.save(task);

    // Emit real-time event for status change
    this.tasksGateway.broadcastTaskStatusChange(
      project.organizationId,
      projectId,
      taskId,
      oldStatus,
      dto.status,
      userId,
      'User', // TODO: Get actual user name
    );

    return this.findOne(projectId, taskId);
  }

  /**
   * Get status history for a task.
   */
  async getStatusHistory(
    projectId: string,
    taskId: string,
    page = 1,
    limit = 50,
  ) {
    // Verify project and task exist
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${taskId} not found in project ${projectId}`,
      );
    }

    const [history, total] = await this.statusHistoryRepository.findAndCount({
      where: { taskId },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: history.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        changedAt: h.createdAt,
        changedBy: h.changedBy
          ? {
              id: h.changedBy.id,
              firstName: h.changedBy.firstName,
              lastName: h.changedBy.lastName,
              email: h.changedBy.email,
            }
          : null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get task progress statistics for a project.
   */
  async getProjectProgress(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status')
      .getRawMany();

    const statsByStatus = Object.fromEntries(
      stats.map((s) => [s.status, parseInt(s.count)]),
    );

    const total = (Object.values(statsByStatus) as number[]).reduce((a, b) => a + b, 0);
    const completed = statsByStatus[TaskStatus.DONE] || 0;

    return {
      projectId,
      total,
      completed,
      inProgress: statsByStatus[TaskStatus.IN_PROGRESS] || 0,
      inReview: statsByStatus[TaskStatus.IN_REVIEW] || 0,
      todo: statsByStatus[TaskStatus.TODO] || 0,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Get task progress statistics for a user within a project.
   */
  async getUserProgress(projectId: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Verify user is in organization
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        organizationId: project.organizationId,
      },
    });

    if (!membership) {
      throw new BadRequestException(
        `User with ID ${userId} is not a member of organization ${project.organizationId}`,
      );
    }

    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.assignedToUserId = :userId', { userId })
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status')
      .getRawMany();

    const statsByStatus = Object.fromEntries(
      stats.map((s) => [s.status, parseInt(s.count)]),
    );

    const total = (Object.values(statsByStatus) as number[]).reduce((a, b) => a + b, 0);
    const completed = statsByStatus[TaskStatus.DONE] || 0;

    return {
      projectId,
      userId,
      total,
      completed,
      inProgress: statsByStatus[TaskStatus.IN_PROGRESS] || 0,
      inReview: statsByStatus[TaskStatus.IN_REVIEW] || 0,
      todo: statsByStatus[TaskStatus.TODO] || 0,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  private toResponse(task: Task) {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? null,
      dueDate: task.dueDate ?? null,
      status: task.status,
      priority: task.priority,
      assignedToUserId: task.assignedToUserId ?? null,
      createdByUserId: task.createdByUserId ?? null,
      metadata: task.metadata ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo.id,
            firstName: task.assignedTo.firstName,
            lastName: task.assignedTo.lastName,
            email: task.assignedTo.email,
          }
        : null,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            firstName: task.createdBy.firstName,
            lastName: task.createdBy.lastName,
            email: task.createdBy.email,
          }
        : null,
    };
  }
}
