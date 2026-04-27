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
  Headers,
} from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles, CurrentUser } from '../../auth/decorators';
import { CreateProjectDto, UpdateProjectDto } from '../dtos';
import { OrganizationRole } from '../../../common/enums';

@Controller('projects')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /projects
   * All org members may list projects for the organization passed in headers.
   */
  @Get()
  async findAll(
    @Headers('x-org-id') orgId: string,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.findAll(orgId, +page || 1, +limit || 20);
  }

  /**
   * GET /projects/:id
   * All org members may view a single project for the organization passed in headers.
   */
  @Get(':id')
  async findOne(
    @Headers('x-org-id') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.findOne(orgId, id);
  }

  /**
   * POST /projects
   * Org ADMIN or OWNER only.
   */
  @Post()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async create(
    @Headers('x-org-id') orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.create(orgId, user.id, dto);
  }

  /**
   * PUT /projects/:id
   * Org ADMIN or OWNER only.
   */
  @Put(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async update(
    @Headers('x-org-id') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.update(orgId, id, dto);
  }

  /**
   * DELETE /projects/organizations/:orgId/:id
   * Org ADMIN or OWNER only.
   */
  @Delete(':id')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async remove(
    @Headers('x-org-id') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    this.validateWorkspace(orgId, user);
    return this.projectsService.remove(orgId, id, user.id);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Ensure the request's orgId matches the JWT workspace context.
   * System ADMINs bypass this check.
   */
  private validateWorkspace(orgId: string, user: any) {
    if (user.role !== OrganizationRole.ADMIN && orgId !== user.selectedOrgId) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization than your current workspace',
      );
    }
  }
}
