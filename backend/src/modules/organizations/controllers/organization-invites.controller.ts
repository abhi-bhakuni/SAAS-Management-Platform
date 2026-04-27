import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators';
import { CurrentUser } from '../../auth/decorators';
import { OrganizationRole } from '@common/enums';
import { User } from '../../users/entities/user.entity';
import { OrganizationInvitesService } from '../services/organization-invites.service';
import {
  CreateInviteDto,
  InviteResponseDto,
  ListInvitesDto,
} from '../dtos';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationInvitesController {
  constructor(private readonly invitesService: OrganizationInvitesService) {}

  /**
   * Create organization invite
   * POST /organizations/invites
   */
  @Post('invites')
  @Roles(OrganizationRole.ADMIN)
  async createInvite(
    @Headers('x-org-id') orgId: string,
    @Body() createInviteDto: CreateInviteDto,
    @CurrentUser() user: User,
  ): Promise<InviteResponseDto> {
    return this.invitesService.createInvite(orgId, createInviteDto, user.id);
  }

  /**
   * List organization invites
   * GET /organizations/invites
   */
  @Get('invites')
  @Roles(OrganizationRole.ADMIN)
  async listInvites(
    @Headers('x-org-id') orgId: string,
    @Query() filter: ListInvitesDto,
  ): Promise<any> {
    return this.invitesService.listInvites(orgId, filter);
  }

  @Get('invites/:inviteId')
  @Roles(OrganizationRole.ADMIN)
  async getInvite(
    @Param('inviteId') inviteId: string,
  ): Promise<InviteResponseDto> {
    return this.invitesService.getInvite(inviteId);
  }

  /**
   * Revoke organization invite
   * DELETE /organizations/invites/:inviteId
   */
  @Delete('invites/:inviteId')
  @Roles(OrganizationRole.ADMIN)
  async revokeInvite(
    @Headers('x-org-id') orgId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<InviteResponseDto> {
    return this.invitesService.revokeInvite(inviteId, orgId);
  }

  /**
   * Resend organization invite
   * POST /organizations/invites/:inviteId/resend
   */
  @Post('invites/:inviteId/resend')
  @Roles(OrganizationRole.ADMIN)
  async resendInvite(
    @Headers('x-org-id') orgId: string,
    @Param('inviteId') inviteId: string,
  ): Promise<InviteResponseDto> {
    return this.invitesService.resendInvite(inviteId, orgId);
  }
}
