import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators';
import { CurrentUser } from '../../auth/decorators';
import { UserRole } from '@common/enums';
import { User } from '../../users/entities/user.entity';
import { OrganizationInvitesService } from '../services/organization-invites.service';
import {
  CreateInviteDto,
  InviteResponseDto,
  ListInvitesDto,
  AcceptInviteDto,
} from '../dtos';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationInvitesController {
  constructor(private readonly invitesService: OrganizationInvitesService) {}

  /**
   * Create organization invite
   * POST /organizations/:orgId/invites
   */
  @Post(':orgId/invites')
  @Roles(UserRole.ADMIN)
  async createInvite(
    @Param('orgId') orgId: string,
    @Body() createInviteDto: CreateInviteDto,
    @CurrentUser() user: User,
  ): Promise<InviteResponseDto> {
    return this.invitesService.createInvite(orgId, createInviteDto, user.id);
  }

  /**
   * List organization invites
   * GET /organizations/:orgId/invites
   */
  @Get(':orgId/invites')
  @Roles(UserRole.ADMIN)
  async listInvites(
    @Param('orgId') orgId: string,
    @Query() filter: ListInvitesDto,
  ): Promise<any> {
    return this.invitesService.listInvites(orgId, filter);
  }

  /**
   * Revoke organization invite
   * DELETE /organizations/:orgId/invites/:inviteId
   */
  @Delete(':orgId/invites/:inviteId')
  @Roles(UserRole.ADMIN)
  async revokeInvite(
    @Param('orgId') orgId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<InviteResponseDto> {
    return this.invitesService.revokeInvite(inviteId, orgId);
  }

  /**
   * Resend organization invite
   * POST /organizations/:orgId/invites/:inviteId/resend
   */
  @Post(':orgId/invites/:inviteId/resend')
  @Roles(UserRole.ADMIN)
  async resendInvite(
    @Param('orgId') orgId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<InviteResponseDto> {
    return this.invitesService.resendInvite(inviteId, orgId);
  }
}
