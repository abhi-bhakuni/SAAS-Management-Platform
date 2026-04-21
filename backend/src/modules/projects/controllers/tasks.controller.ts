import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles } from '../../auth/decorators';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, UnassignTaskDto, UpdateTaskStatusDto } from '../dtos';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * GET /tasks?projectId=:projectId
   * All org members may list tasks for the organization passed in headers.
   */
  @Get()
  async findAll(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Query('projectId') projectId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.tasksService.findAll(orgId, projectId, +page || 1, +limit || 20);
  }

  /**
   * GET /tasks/filter/status?projectId=:projectId&status=:status
   * Filter tasks by status.
   */
  @Get('filter/status')
  async findByStatus(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Query('projectId') projectId: string,
    @Query('status') status: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.tasksService.findByStatus(
      projectId,
      status,
      +page || 1,
      +limit || 20,
    );
  }

  /**
   * GET /tasks/assignee/:targetUserId?projectId=:projectId
   * Get tasks assigned to a specific user.
   */
  @Get('assignee/:targetUserId')
  async findByAssignee(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('targetUserId') targetUserId: string,
    @Query('projectId') projectId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.tasksService.findByAssignee(
      projectId,
      targetUserId,
      +page || 1,
      +limit || 20,
    );
  }

  /**
   * GET /tasks/assignable-users?projectId=:projectId
   * Get all organization members who can be assigned to tasks.
   */
  @Get('assignable-users')
  async getAssignableUsers(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.getAssignableUsers(projectId);
  }

  /**
   * GET /tasks/progress/project-stats?projectId=:projectId
   * Get task progress statistics for the project.
   */
  @Get('progress/project-stats')
  async getProjectProgress(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.getProjectProgress(projectId);
  }

  /**
   * GET /tasks/progress/user-stats/:targetUserId?projectId=:projectId
   * Get task progress statistics for a user in the project.
   */
  @Get('progress/user-stats/:targetUserId')
  async getUserProgress(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('targetUserId') targetUserId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.getUserProgress(projectId, targetUserId);
  }

  /**
   * GET /tasks/:id?projectId=:projectId
   * All org members may view a single task for the organization passed in headers.
   */
  @Get(':id')
  async findOne(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.findOne(projectId, id);
  }

  /**
   * GET /tasks/:id/status-history?projectId=:projectId
   * Get full status change history for a task.
   */
  @Get(':id/status-history')
  async getStatusHistory(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') taskId: string,
    @Query('projectId') projectId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.tasksService.getStatusHistory(
      projectId,
      taskId,
      +page || 1,
      +limit || 50,
    );
  }

  /**
   * POST /tasks?projectId=:projectId
   * Org ADMIN or higher only.
   */
  @Post()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async create(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Query('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, userId, dto);
  }

  /**
   * PUT /tasks/:id?projectId=:projectId
   * Org ADMIN or higher only.
   */
  @Put(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async update(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, id, dto, userId);
  }

  /**
   * DELETE /tasks/:id?projectId=:projectId
   * Org ADMIN or higher only.
   */
  @Delete(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async remove(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.remove(projectId, id);
  }

  /**
   * POST /tasks/:id/assign?projectId=:projectId
   * Assign a task to a user (org ADMIN or higher).
   */
  @Post(':id/assign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async assignUser(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') taskId: string,
    @Query('projectId') projectId: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assignUser(projectId, taskId, dto.assignedToUserId, userId);
  }

  /**
   * PATCH /tasks/:id/unassign?projectId=:projectId
   * Unassign a task from its current assignee (org ADMIN or higher).
   */
  @Patch(':id/unassign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async unassignUser(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') taskId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.unassignUser(projectId, taskId);
  }

  /**
   * PATCH /tasks/:id/status?projectId=:projectId
   * Update task status (org ADMIN or higher).
   */
  @Patch(':id/status')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async updateStatus(
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-user-id') userId: string,
    @Param('id') taskId: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(projectId, taskId, userId, dto);
  }
}
