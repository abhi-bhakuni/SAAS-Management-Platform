import { Controller, Get, Query } from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { Public } from '../auth/decorators/index';

@Public()
@Controller('sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Get('dashboard')
  getDashboard() {
    return this.sandboxService.getDashboardData();
  }

  @Get('projects')
  getProjects() {
    return this.sandboxService.getProjects();
  }

  @Get('tasks')
  getTasks() {
    return this.sandboxService.getTasks();
  }

  @Get('activity')
  getActivity() {
    return this.sandboxService.getActivity();
  }

  @Get('members')
  getMembers(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.sandboxService.getMembers(Number(page), Number(limit));
  }
}
