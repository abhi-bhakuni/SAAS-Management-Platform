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
  ForbiddenException,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles, CurrentUser } from '../../auth/decorators';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, UnassignTaskDto, UpdateTaskStatusDto } from '../dtos';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';
import { UserRole } from '../../../common/enums';

@Controller('organizations/:orgId/projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks
   * All org members may list tasks.
   */
  @Get()
  async findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findAll(projectId, +page || 1, +limit || 20);
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks/:id
   * All org members may view a single task.
   */
  @Get(':id')
  async findOne(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findOne(projectId, id);
  }

  /**
   * POST /organizations/:orgId/projects/:projectId/tasks
   * Org ADMIN or higher only.
   */
  @Post()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async create(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.create(projectId, user.id, dto);
  }

  /**
   * PUT /organizations/:orgId/projects/:projectId/tasks/:id
   * Org ADMIN or higher only.
   */
  @Put(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.update(projectId, id, dto, user.id);
  }

  /**
   * DELETE /organizations/:orgId/projects/:projectId/tasks/:id
   * Org ADMIN or higher only.
   */
  @Delete(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async remove(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.remove(projectId, id);
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks?status=pending
   * Filter tasks by status.
   */
  @Get('filter/status')
  async findByStatus(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Query('status') status: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findByStatus(
      projectId,
      status,
      +page || 1,
      +limit || 20,
    );
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks/assignee/:userId
   * Get tasks assigned to a specific user.
   */
  @Get('assignee/:userId')
  async findByAssignee(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findByAssignee(
      projectId,
      userId,
      +page || 1,
      +limit || 20,
    );
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks/assignable-users
   * Get all organization members who can be assigned to tasks.
   */
  @Get('assignable-users')
  async getAssignableUsers(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getAssignableUsers(projectId);
  }

  /**
   * POST /organizations/:orgId/projects/:projectId/tasks/:id/assign
   * Assign a task to a user (org ADMIN or higher).
   */
  @Post(':id/assign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async assignUser(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.assignUser(projectId, taskId, dto.assignedToUserId, user.id);
  }

  /**
   * PATCH /organizations/:orgId/projects/:projectId/tasks/:id/unassign
   * Unassign a task from its current assignee (org ADMIN or higher).
   */
  @Patch(':id/unassign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async unassignUser(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.unassignUser(projectId, taskId);
  }

  /**
   * PATCH /organizations/:orgId/projects/:projectId/tasks/:id/status
   * Update task status (org ADMIN or higher).
   */
  @Patch(':id/status')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async updateStatus(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.updateStatus(projectId, taskId, user.id, dto);
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/tasks/:id/status-history
   * Get full status change history for a task.
   */
  @Get(':id/status-history')
  async getStatusHistory(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getStatusHistory(
      projectId,
      taskId,
      +page || 1,
      +limit || 50,
    );
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/progress
   * Get task progress statistics for the project.
   */
  @Get('progress/project-stats')
  async getProjectProgress(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getProjectProgress(projectId);
  }

  /**
   * GET /organizations/:orgId/projects/:projectId/progress/user/:userId
   * Get task progress statistics for a user within the project.
   */
  @Get('progress/user/:userId')
  async getUserProgress(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getUserProgress(projectId, userId);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Ensure the request's orgId matches the JWT workspace context.
   * System ADMINs bypass this check.
   */
  private validateWorkspace(orgId: string, user: any) {
    if (user.role !== UserRole.ADMIN && orgId !== user.selectedOrgId) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization than your current workspace',
      );
    }
  }
}
