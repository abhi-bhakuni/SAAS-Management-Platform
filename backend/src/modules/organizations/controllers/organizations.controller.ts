import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationsService } from '../services/organizations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { Roles, CurrentUser, CurrentOrganization } from '../../auth/decorators/index';
import { UserRole } from '../../../common/enums';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * GET /organizations - List organizations (admin views all, others see only current workspace)
   */
  @Get()
  async findAll(@CurrentUser() user: any): Promise<any> {
    // System ADMIN can see all organizations
    if (user.role === UserRole.ADMIN) {
      return this.organizationsService.findAll();
    }
    // Regular users can only see their current organization
    if (user.selectedOrgId) {
      const org = await this.organizationsService.findOne(user.selectedOrgId);
      return [org];
    }
    return [];
  }

  /**
   * GET /organizations/:orgId - Get single organization
   * Validates org matches current workspace context from JWT
   */
  @UseGuards(OrgMembershipGuard)
  @Get(':orgId')
  async findOne(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization',
      );
    }
    return this.organizationsService.findOne(orgId);
  }

  /**
   * GET /organizations/:orgId/dashboard-stats - Get dashboard statistics with trend calculations
   */
  @UseGuards(OrgMembershipGuard)
  @Get(':orgId/dashboard-stats')
  async getDashboardStats(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization',
      );
    }
    return this.organizationsService.getDashboardStats(orgId);
  }

  /**
   * POST /organizations - Create new organization (admin only)
   */
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() createOrgDto: any): Promise<any> {
    return this.organizationsService.create(createOrgDto);
  }

  /**
   * PUT /organizations/:orgId - Update organization
   * Admins can update any org; members can only update through OrgRoleGuard
   */
  @UseGuards(OrgMembershipGuard)
  @Put(':orgId')
  async update(
    @Param('orgId') orgId: string,
    @Body() updateOrgDto: any,
    @CurrentUser() user: any,
  ): Promise<any> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Workspace mismatch: cannot access a different organization',
      );
    }
    return this.organizationsService.update(orgId, updateOrgDto);
  }

  /**
   * DELETE /organizations/:orgId - Delete organization (admin only)
   */
  @Roles(UserRole.ADMIN)
  @Delete(':orgId')
  async remove(@Param('orgId') orgId: string): Promise<any> {
    return this.organizationsService.remove(orgId);
  }
}
