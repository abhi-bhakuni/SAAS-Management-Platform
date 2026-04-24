import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ActivityService } from '../services/activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { CurrentOrganization, CurrentUser } from '../../auth/decorators/index';
import { CreateActivityDto } from '../dtos/create-activity.dto';

@Controller('activity')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivity(@CurrentOrganization() orgId: string) {
    return this.activityService.getActivityForOrg(orgId);
  }

  @Post()
  async createActivity(
    @CurrentUser() user: any,
    @Body() createActivityDto: CreateActivityDto,
    @Req() request: Request,
  ) {
    return this.activityService.createActivity(user?.id, createActivityDto, request);
  }
}