import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles, CurrentUser } from '../../auth/decorators';
import { CreateProjectDto, UpdateProjectDto } from '../dtos';
import { OrganizationRole } from '../../users/entities/user-organization-membership.entity';
import { UserRole } from '../../../common/enums';

@Controller('organizations/:orgId/projects')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /organizations/:orgId/projects
   * All org members may list projects.
   */
  @Get()
  async findAll(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.findAll(orgId, +page || 1, +limit || 20);
  }

  /**
   * GET /organizations/:orgId/projects/:id
   * All org members may view a single project.
   */
  @Get(':id')
  async findOne(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.findOne(orgId, id);
  }

  /**
   * POST /organizations/:orgId/projects
   * Org ADMIN or OWNER only.
   */
  @Post()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.create(orgId, user.id, dto);
  }

  /**
   * PUT /organizations/:orgId/projects/:id
   * Org ADMIN or OWNER only.
   */
  @Put(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.update(orgId, id, dto);
  }

  /**
   * DELETE /organizations/:orgId/projects/:id
   * Org ADMIN or OWNER only.
   */
  @Delete(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.remove(orgId, id);
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
