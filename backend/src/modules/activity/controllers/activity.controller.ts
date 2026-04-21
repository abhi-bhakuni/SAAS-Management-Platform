import { Controller, Get, UseGuards } from '@nestjs/common';
import { ActivityService } from '../services/activity.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../auth/guards/org-membership.guard';
import { CurrentOrganization } from '../../auth/decorators/index';

@Controller('activity')
@UseGuards(JwtAuthGuard, OrgMembershipGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivity(@CurrentOrganization() orgId: string) {
    return this.activityService.getActivityForOrg(orgId);
  }
}