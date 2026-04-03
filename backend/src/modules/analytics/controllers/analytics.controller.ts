import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from '../services/analytics.service';
import {
  DashboardDataDto,
  TaskCompletionMetricsDto,
  TaskStatusDistributionDto,
  ProductivityMetricsDto,
  TimeBasedMetricsDto,
  ProjectAnalyticsDto,
  TasksCompletedSummaryDto,
  WeeklyPerformanceChartDto,
} from '../dtos/analytics-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard analytics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics data',
    type: DashboardDataDto,
  })
  async getDashboard(@Request() req) {
    const userId = req.user.id;
    const dashboardData = await this.analyticsService.getDashboardData(userId);
    return { dashboard: dashboardData };
  }

  @Get('tasks/completion')
  @ApiOperation({ summary: 'Get task completion metrics' })
  @ApiResponse({
    status: 200,
    description: 'Task completion metrics',
    type: TaskCompletionMetricsDto,
  })
  async getTaskCompletionMetrics(@Request() req) {
    const userId = req.user.id;
    const metrics = await this.analyticsService.getTaskCompletionMetrics(userId);
    return { metrics };
  }

  @Get('tasks/status-distribution')
  @ApiOperation({ summary: 'Get task status distribution' })
  @ApiResponse({
    status: 200,
    description: 'Task status distribution',
    type: TaskStatusDistributionDto,
  })
  async getTaskStatusDistribution(@Request() req) {
    const userId = req.user.id;
    const distribution = await this.analyticsService.getTaskStatusDistribution(userId);
    return { distribution };
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Get productivity metrics' })
  @ApiResponse({
    status: 200,
    description: 'Productivity metrics',
    type: ProductivityMetricsDto,
  })
  async getProductivityMetrics(@Request() req) {
    const userId = req.user.id;
    const metrics = await this.analyticsService.getProductivityMetrics(userId);
    return { metrics };
  }

  @Get('time-based')
  @ApiOperation({ summary: 'Get time-based completion metrics' })
  @ApiResponse({
    status: 200,
    description: 'Time-based metrics',
    type: TimeBasedMetricsDto,
  })
  async getTimeBasedMetrics(
    @Request() req,
    @Query('days') days?: string,
  ) {
    const userId = req.user.id;
    const daysCount = days ? parseInt(days, 10) : 30;
    const metrics = await this.analyticsService.getTimeBasedMetrics(userId, daysCount);
    return { metrics };
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get project analytics' })
  @ApiResponse({
    status: 200,
    description: 'Project analytics',
    type: ProjectAnalyticsDto,
  })
  async getProjectAnalytics(@Request() req) {
    const userId = req.user.id;
    const analytics = await this.analyticsService.getProjectAnalytics(userId);
    return { analytics };
  }

  @Get('tasks-completed')
  @ApiOperation({ summary: 'Get tasks completed summary' })
  @ApiResponse({
    status: 200,
    description: 'Tasks completed summary',
    type: TasksCompletedSummaryDto,
  })
  async getTasksCompleted(@Request() req) {
    const userId = req.user.id;
    const metrics = await this.analyticsService.getTaskCompletionMetrics(userId);

    return {
      tasksCompleted: {
        today: metrics.tasksCompletedToday,
        thisWeek: metrics.tasksCompletedThisWeek,
        thisMonth: metrics.tasksCompletedThisMonth,
        total: metrics.completedTasks,
      },
      completionRate: metrics.completionRate,
      averageCompletionTime: metrics.averageCompletionTime,
    };
  }

  @Get('weekly-performance')
  @ApiOperation({ summary: 'Get weekly performance chart data' })
  @ApiResponse({
    status: 200,
    description: 'Weekly performance chart data',
    type: [WeeklyPerformanceChartDto],
  })
  async getWeeklyPerformanceChart(
    @Request() req,
    @Query('weeks') weeks?: string,
  ) {
    const userId = req.user.id;
    const weeksCount = weeks ? parseInt(weeks, 10) : 12;
    const chartData = await this.analyticsService.getWeeklyPerformanceChart(userId, weeksCount);
    return { chartData };
  }
}