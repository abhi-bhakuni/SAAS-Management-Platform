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
  Headers,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles, CurrentUser } from '../../auth/decorators';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, UnassignTaskDto, UpdateTaskStatusDto } from '../dtos';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';
import { UserRole } from '../../../common/enums';

@Controller('tasks')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * GET /tasks
   * All org members may list tasks for the organization passed in headers.
   */
  @Get()
  async findAll(
    @Headers('x-org-id') orgId: string,
    @CurrentUser() user: any,
    @Query('projectId') projectId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findAll(orgId, projectId, +page || 1, +limit || 20);
  }

  /**
   * GET /tasks/:projectId/:id
   * All org members may view a single task for the organization passed in headers.
   */
  @Get(':projectId/:id')
  async findOne(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.findOne(projectId, id);
  }

  /**
   * POST /tasks/:projectId
   * Org ADMIN or higher only.
   */
  @Post(':projectId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async create(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.create(projectId, user.id, dto);
  }

  /**
   * PUT /tasks/organizations/:orgId/projects/:projectId/tasks/:id
   * Org ADMIN or higher only.
   */
  @Put(':projectId/:id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async update(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.update(projectId, id, dto, user.id);
  }

  /**
   * DELETE /tasks/:projectId/:id
   * Org ADMIN or higher only.
   */
  @Delete(':projectId/:id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async remove(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.remove(projectId, id);
  }

  /**
   * GET /tasks/organizations/:orgId/projects/:projectId/tasks/filter/status
   * Filter tasks by status.
   */
  @Get(':projectId/filter/status')
  async findByStatus(
    @Headers('x-org-id') orgId: string,
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
   * GET /tasks/organizations/:orgId/projects/:projectId/tasks/assignee/:userId
   * Get tasks assigned to a specific user.
   */
  @Get(':projectId/assignee/:userId')
  async findByAssignee(
    @Headers('x-org-id') orgId: string,
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
   * GET /tasks/organizations/:orgId/projects/:projectId/tasks/assignable-users
   * Get all organization members who can be assigned to tasks.
   */
  @Get(':projectId/assignable-users')
  async getAssignableUsers(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getAssignableUsers(projectId);
  }

  /**
   * POST /tasks/organizations/:orgId/projects/:projectId/tasks/:id/assign
   * Assign a task to a user (org ADMIN or higher).
   */
  @Post(':projectId/:id/assign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async assignUser(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.assignUser(projectId, taskId, dto.assignedToUserId, user.id);
  }

  /**
   * PATCH /tasks/organizations/:orgId/projects/:projectId/tasks/:id/unassign
   * Unassign a task from its current assignee (org ADMIN or higher).
   */
  @Patch(':projectId/:id/unassign')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async unassignUser(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.unassignUser(projectId, taskId);
  }

  /**
   * PATCH /tasks/organizations/:orgId/projects/:projectId/tasks/:id/status
   * Update task status (org ADMIN or higher).
   */
  @Patch(':projectId/:id/status')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async updateStatus(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.updateStatus(projectId, taskId, user.id, dto);
  }

  /**
   * GET /tasks/organizations/:orgId/projects/:projectId/tasks/:id/status-history
   * Get full status change history for a task.
   */
  @Get(':projectId/:id/status-history')
  async getStatusHistory(
    @Headers('x-org-id') orgId: string,
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
   * GET /tasks/organizations/:orgId/projects/:projectId/progress/project-stats
   * Get task progress statistics for the project.
   */
  @Get(':projectId/progress/project-stats')
  async getProjectProgress(
    @Headers('x-org-id') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.tasksService.getProjectProgress(projectId);
  }

  /**
   * GET /tasks/organizations/:orgId/projects/:projectId/progress/user/:userId
   * Get task progress statistics for a user within the project.
   */
  @Get(':projectId/progress/user/:userId')
  async getUserProgress(
    @Headers('x-org-id') orgId: string,
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
