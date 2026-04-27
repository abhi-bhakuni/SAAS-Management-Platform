import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { OrgRoleGuard } from '../../auth/guards/org-role.guard';
import { OrgRoles, CurrentUser } from '../../auth/decorators';
import { UserOrganizationService } from '../services/user-organization.service';
import {
  AddMemberDto,
  UpdateMemberRoleDto,
  MemberResponseDto,
} from '../dtos';
import { OrganizationRole } from '../../../common/enums';

@Controller('organizations/members')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class OrganizationMembersController {
  constructor(private readonly userOrgService: UserOrganizationService) {}

  /**
   * Get all members of organization (paginated)
   */
  @Get()
  async getMembers(
    @Headers('x-org-id') orgId: string,
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    // Validate workspace context
    if (orgId !== user.selectedOrgId) {
      throw new ForbiddenException('Workspace mismatch - cannot access different org');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    return this.userOrgService.getOrgMembers(orgId, pageNum, limitNum);
  }

  /**
   * Add member to organization (org owner/admin only)
   */
  @Post()
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async addMember(
    @Headers('x-org-id') orgId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: any,
  ): Promise<MemberResponseDto> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId) {
      throw new ForbiddenException('Workspace mismatch - cannot access different org');
    }

    const membership = await this.userOrgService.addUserToOrganization(
      addMemberDto.userId,
      orgId,
      addMemberDto.role || OrganizationRole.MEMBER,
    );

    return this.mapToResponseDto(membership);
  }

  /**
   * Update member role (org owner/admin only)
   */
  @Put(':userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async updateMemberRole(
    @Headers('x-org-id') orgId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
    @CurrentUser() user: any,
  ): Promise<MemberResponseDto> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId) {
      throw new ForbiddenException('Workspace mismatch - cannot access different org');
    }

    // Prevent demoting yourself if you're the only admin
    if (userId === user.id && updateRoleDto.role !== OrganizationRole.ADMIN) {
      const admins = await this.userOrgService.getOrgAdmins(orgId);
      if (admins.length === 1 && admins[0].userId === user.id) {
        throw new ForbiddenException(
          'Cannot demote the last admin of the organization',
        );
      }
    }

    const membership = await this.userOrgService.updateMemberRole(
      userId,
      orgId,
      updateRoleDto.role,
    );

    return this.mapToResponseDto(membership);
  }

  /**
   * Remove member from organization (org owner/admin only)
   */
  @Delete(':userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrganizationRole.ADMIN)
  async removeMember(
    @Headers('x-org-id') orgId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    // Validate workspace context
    if (orgId !== user.selectedOrgId) {
      throw new ForbiddenException('Workspace mismatch - cannot access different org');
    }

    // Prevent removing yourself if you're the only admin
    if (userId === user.id) {
      const admins = await this.userOrgService.getOrgAdmins(orgId);
      if (admins.length === 1 && admins[0].userId === user.id) {
        throw new ForbiddenException(
          'Cannot remove yourself as the last admin of the organization',
        );
      }
    }

    await this.userOrgService.removeUserFromOrganization(userId, orgId);

    return { success: true };
  }

  /**
   * Map membership to response DTO
   */
  private mapToResponseDto(membership: any): MemberResponseDto {
    return {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user && {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
      },
    };
  }
}
