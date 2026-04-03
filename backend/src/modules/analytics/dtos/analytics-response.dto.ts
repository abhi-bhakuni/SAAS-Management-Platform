import { ApiProperty } from '@nestjs/swagger';

export class TaskCompletionMetricsDto {
  @ApiProperty({ description: 'Total number of tasks assigned to the user' })
  totalTasks: number;

  @ApiProperty({ description: 'Number of completed tasks' })
  completedTasks: number;

  @ApiProperty({ description: 'Completion rate as percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average completion time in hours' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Tasks completed today' })
  tasksCompletedToday: number;

  @ApiProperty({ description: 'Tasks completed this week' })
  tasksCompletedThisWeek: number;

  @ApiProperty({ description: 'Tasks completed this month' })
  tasksCompletedThisMonth: number;
}

export class TaskStatusDistributionDto {
  @ApiProperty({ description: 'Number of tasks in TODO status' })
  todo: number;

  @ApiProperty({ description: 'Number of tasks in IN_PROGRESS status' })
  inProgress: number;

  @ApiProperty({ description: 'Number of tasks in IN_REVIEW status' })
  inReview: number;

  @ApiProperty({ description: 'Number of tasks in DONE status' })
  done: number;
}

export class ProductivityMetricsDto {
  @ApiProperty({ description: 'Average tasks per user' })
  tasksPerUser: number;

  @ApiProperty({ description: 'Completion rate by priority level' })
  completionRateByPriority: Record<string, number>;

  @ApiProperty({ description: 'Number of overdue tasks' })
  overdueTasks: number;

  @ApiProperty({ description: 'Tasks due today' })
  tasksDueToday: number;

  @ApiProperty({ description: 'Tasks due this week' })
  tasksDueThisWeek: number;
}

export class TimeBasedMetricsDto {
  @ApiProperty({ description: 'Daily task completion data' })
  dailyCompletions: Array<{ date: string; count: number }>;

  @ApiProperty({ description: 'Weekly task completion data' })
  weeklyCompletions: Array<{ week: string; count: number }>;

  @ApiProperty({ description: 'Monthly task completion data' })
  monthlyCompletions: Array<{ month: string; count: number }>;
}

export class ProjectAnalyticsDto {
  @ApiProperty({ description: 'Total number of projects' })
  totalProjects: number;

  @ApiProperty({ description: 'Number of active projects' })
  activeProjects: number;

  @ApiProperty({ description: 'Number of completed projects' })
  completedProjects: number;

  @ApiProperty({ description: 'Average tasks per project' })
  averageTasksPerProject: number;

  @ApiProperty({ description: 'Project completion rate as percentage' })
  projectCompletionRate: number;
}
export class WeeklyPerformanceChartDto {
  @ApiProperty({ description: 'Week identifier (YYYY-MM-DD format)' })
  week: string;

  @ApiProperty({ description: 'Number of tasks completed this week' })
  tasksCompleted: number;

  @ApiProperty({ description: 'Number of tasks created this week' })
  tasksCreated: number;

  @ApiProperty({ description: 'Average completion time in hours' })
  averageCompletionTime: number;

  @ApiProperty({ description: 'Productivity score for the week' })
  productivityScore: number;

  @ApiProperty({ description: 'Task status distribution for the week' })
  statusDistribution: TaskStatusDistributionDto;
}
export class DashboardDataDto {
  @ApiProperty({ description: 'Task completion metrics' })
  taskCompletionMetrics: TaskCompletionMetricsDto;

  @ApiProperty({ description: 'Task status distribution' })
  taskStatusDistribution: TaskStatusDistributionDto;

  @ApiProperty({ description: 'Productivity metrics' })
  productivityMetrics: ProductivityMetricsDto;

  @ApiProperty({ description: 'Time-based completion metrics' })
  timeBasedMetrics: TimeBasedMetricsDto;

  @ApiProperty({ description: 'Project analytics' })
  projectAnalytics: ProjectAnalyticsDto;

  @ApiProperty({ description: 'When the data was generated' })
  generatedAt: Date;
}

export class TasksCompletedSummaryDto {
  @ApiProperty({ description: 'Tasks completed in different time periods' })
  tasksCompleted: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };

  @ApiProperty({ description: 'Overall completion rate as percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average completion time in hours' })
  averageCompletionTime: number;
}