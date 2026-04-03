import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Task } from '../../projects/entities/task.entity';
import { TaskStatusHistory } from '../../projects/entities/task-status-history.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../../../common/enums';

export interface TaskCompletionMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
}

export interface TaskStatusDistribution {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface ProductivityMetrics {
  tasksPerUser: number;
  completionRateByPriority: Record<string, number>;
  overdueTasks: number;
  tasksDueToday: number;
  tasksDueThisWeek: number;
}

export interface TimeBasedMetrics {
  dailyCompletions: Array<{ date: string; count: number }>;
  weeklyCompletions: Array<{ week: string; count: number }>;
  monthlyCompletions: Array<{ month: string; count: number }>;
}

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageTasksPerProject: number;
  projectCompletionRate: number;
}

export interface WeeklyPerformanceChart {
  week: string;
  tasksCompleted: number;
  tasksCreated: number;
  averageCompletionTime: number;
  productivityScore: number;
  statusDistribution: {
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskStatusHistory)
    private taskStatusHistoryRepository: Repository<TaskStatusHistory>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Get task completion metrics for a user
  async getTaskCompletionMetrics(userId: string): Promise<TaskCompletionMetrics> {
    const userTasks = await this.taskRepository.find({
      where: { assignedToUserId: userId },
    });

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.isCompleted()).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average completion time
    const completionTimes = await this.calculateAverageCompletionTime(userId);
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Get tasks completed in different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tasksCompletedToday = await this.taskRepository.count({
      where: {
        assignedToUserId: userId,
        status: TaskStatus.DONE,
        updatedAt: MoreThanOrEqual(today),
      },
    });

    const tasksCompletedThisWeek = await this.taskRepository.count({
      where: {
        assignedToUserId: userId,
        status: TaskStatus.DONE,
        updatedAt: MoreThanOrEqual(weekAgo),
      },
    });

    const tasksCompletedThisMonth = await this.taskRepository.count({
      where: {
        assignedToUserId: userId,
        status: TaskStatus.DONE,
        updatedAt: MoreThanOrEqual(monthAgo),
      },
    });

    return {
      totalTasks,
      completedTasks,
      completionRate,
      averageCompletionTime,
      tasksCompletedToday,
      tasksCompletedThisWeek,
      tasksCompletedThisMonth,
    };
  }

  // Get task status distribution for a user
  async getTaskStatusDistribution(userId: string): Promise<TaskStatusDistribution> {
    const tasks = await this.taskRepository.find({
      where: { assignedToUserId: userId },
    });

    return {
      todo: tasks.filter(task => task.status === TaskStatus.TODO).length,
      inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      inReview: tasks.filter(task => task.status === TaskStatus.IN_REVIEW).length,
      done: tasks.filter(task => task.status === TaskStatus.DONE).length,
    };
  }

  // Get productivity metrics for a user
  async getProductivityMetrics(userId: string): Promise<ProductivityMetrics> {
    const userTasks = await this.taskRepository.find({
      where: { assignedToUserId: userId },
    });

    const totalUsers = await this.userRepository.count();
    const tasksPerUser = totalUsers > 0 ? userTasks.length / totalUsers : 0;

    // Completion rate by priority
    const completionRateByPriority = await this.calculateCompletionRateByPriority(userId);

    // Overdue tasks
    const overdueTasks = userTasks.filter(task => task.isOverdue()).length;

    // Tasks due in different timeframes
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasksDueToday = userTasks.filter(task =>
      task.dueDate && task.dueDate >= today && task.dueDate < tomorrow && !task.isCompleted()
    ).length;

    const tasksDueThisWeek = userTasks.filter(task =>
      task.dueDate && task.dueDate >= today && task.dueDate <= weekFromNow && !task.isCompleted()
    ).length;

    return {
      tasksPerUser,
      completionRateByPriority,
      overdueTasks,
      tasksDueToday,
      tasksDueThisWeek,
    };
  }

  // Get time-based completion metrics
  async getTimeBasedMetrics(userId: string, days: number = 30): Promise<TimeBasedMetrics> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Daily completions
    const dailyCompletions = await this.getDailyCompletions(userId, startDate, endDate);

    // Weekly completions
    const weeklyCompletions = await this.getWeeklyCompletions(userId, startDate, endDate);

    // Monthly completions
    const monthlyCompletions = await this.getMonthlyCompletions(userId, startDate, endDate);

    return {
      dailyCompletions,
      weeklyCompletions,
      monthlyCompletions,
    };
  }

  // Get project analytics for a user
  async getProjectAnalytics(userId: string): Promise<ProjectAnalytics> {
    // Get projects where user is assigned to tasks or is the owner
    const userProjects = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.tasks', 'task')
      .where('task.assignedToUserId = :userId OR project.createdByUserId = :userId', { userId })
      .distinct()
      .getMany();

    const totalProjects = userProjects.length;

    // For simplicity, we'll consider projects with all tasks completed as completed
    const completedProjects = await Promise.all(
      userProjects.map(async (project) => {
        const tasks = await this.taskRepository.find({ where: { projectId: project.id } });
        const completedTasks = tasks.filter(task => task.isCompleted()).length;
        return tasks.length > 0 && completedTasks === tasks.length;
      })
    );

    const activeProjects = totalProjects - completedProjects.filter(Boolean).length;
    const completedProjectsCount = completedProjects.filter(Boolean).length;

    // Average tasks per project
    const allTasks = await this.taskRepository.find({
      where: userProjects.map(project => ({ projectId: project.id })),
    });

    const averageTasksPerProject = totalProjects > 0 ? allTasks.length / totalProjects : 0;
    const projectCompletionRate = totalProjects > 0 ? (completedProjectsCount / totalProjects) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects: completedProjectsCount,
      averageTasksPerProject,
      projectCompletionRate,
    };
  }

  // Get comprehensive dashboard data for a user
  async getDashboardData(userId: string) {
    const [
      taskCompletionMetrics,
      taskStatusDistribution,
      productivityMetrics,
      timeBasedMetrics,
      projectAnalytics,
    ] = await Promise.all([
      this.getTaskCompletionMetrics(userId),
      this.getTaskStatusDistribution(userId),
      this.getProductivityMetrics(userId),
      this.getTimeBasedMetrics(userId),
      this.getProjectAnalytics(userId),
    ]);

    return {
      taskCompletionMetrics,
      taskStatusDistribution,
      productivityMetrics,
      timeBasedMetrics,
      projectAnalytics,
      generatedAt: new Date(),
    };
  }

  // Helper methods
  private async calculateAverageCompletionTime(userId: string): Promise<number[]> {
    const completedTasks = await this.taskRepository.find({
      where: { assignedToUserId: userId, status: TaskStatus.DONE },
      relations: ['project'],
    });

    const completionTimes: number[] = [];

    for (const task of completedTasks) {
      // Find when the task was moved to DONE
      const statusHistory = await this.taskStatusHistoryRepository.findOne({
        where: { taskId: task.id, toStatus: TaskStatus.DONE },
        order: { createdAt: 'DESC' },
      });

      if (statusHistory) {
        const completionTime = statusHistory.createdAt.getTime() - task.createdAt.getTime();
        const hours = completionTime / (1000 * 60 * 60); // Convert to hours
        completionTimes.push(hours);
      }
    }

    return completionTimes;
  }

  // Get weekly performance chart data
  async getWeeklyPerformanceChart(userId: string, weeks: number = 12): Promise<WeeklyPerformanceChart[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    const weeklyData: WeeklyPerformanceChart[] = [];

    // Generate weekly data points
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Tasks completed in this week
      const tasksCompleted = await this.taskRepository.count({
        where: {
          assignedToUserId: userId,
          status: TaskStatus.DONE,
          updatedAt: Between(weekStart, weekEnd),
        },
      });

      // Tasks created in this week
      const tasksCreated = await this.taskRepository.count({
        where: {
          assignedToUserId: userId,
          createdAt: Between(weekStart, weekEnd),
        },
      });

      // Status distribution for tasks active during this week
      const statusDistribution = await this.getTaskStatusDistributionForWeek(userId, weekStart, weekEnd);

      // Calculate average completion time for tasks completed this week
      const completedTasks = await this.taskRepository.find({
        where: {
          assignedToUserId: userId,
          status: TaskStatus.DONE,
          updatedAt: Between(weekStart, weekEnd),
        },
      });

      let averageCompletionTime = 0;
      if (completedTasks.length > 0) {
        const completionTimes: number[] = [];
        for (const task of completedTasks) {
          const statusHistory = await this.taskStatusHistoryRepository.findOne({
            where: { taskId: task.id, toStatus: TaskStatus.DONE },
            order: { createdAt: 'DESC' },
          });

          if (statusHistory) {
            const completionTime = statusHistory.createdAt.getTime() - task.createdAt.getTime();
            const hours = completionTime / (1000 * 60 * 60);
            completionTimes.push(hours);
          }
        }
        averageCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0;
      }

      // Calculate productivity score (tasks completed per day * efficiency factor)
      const productivityScore = tasksCompleted > 0
        ? (tasksCompleted / 7) * (averageCompletionTime > 0 ? Math.max(0, 24 / averageCompletionTime) : 1)
        : 0;

      weeklyData.push({
        week: weekStart.toISOString().split('T')[0], // YYYY-MM-DD format
        tasksCompleted,
        tasksCreated,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100, // Round to 2 decimal places
        productivityScore: Math.round(productivityScore * 100) / 100,
        statusDistribution,
      });
    }

    return weeklyData;
  }

  // Helper method to get task status distribution for a specific week
  private async getTaskStatusDistributionForWeek(userId: string, weekStart: Date, weekEnd: Date) {
    const tasks = await this.taskRepository.find({
      where: {
        assignedToUserId: userId,
        createdAt: LessThanOrEqual(weekEnd),
      },
    });

    // Filter tasks that were active during this week (created before or during the week)
    const activeTasks = tasks.filter(task => {
      const taskCreated = task.createdAt;
      return taskCreated <= weekEnd;
    });

    const statusCounts = {
      todo: 0,
      inProgress: 0,
      inReview: 0,
      done: 0,
    };

    activeTasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.TODO:
          statusCounts.todo++;
          break;
        case TaskStatus.IN_PROGRESS:
          statusCounts.inProgress++;
          break;
        case TaskStatus.IN_REVIEW:
          statusCounts.inReview++;
          break;
        case TaskStatus.DONE:
          statusCounts.done++;
          break;
      }
    });

    return statusCounts;
  }

  private async calculateCompletionRateByPriority(userId: string): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.find({
      where: { assignedToUserId: userId },
    });

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const result: Record<string, number> = {};

    for (const priority of priorities) {
      const priorityTasks = tasks.filter(task => task.priority === priority);
      const completedTasks = priorityTasks.filter(task => task.isCompleted());
      const rate = priorityTasks.length > 0 ? (completedTasks.length / priorityTasks.length) * 100 : 0;
      result[priority] = rate;
    }

    return result;
  }

  private async getDailyCompletions(userId: string, startDate: Date, endDate: Date) {
    const completions = await this.taskRepository
      .createQueryBuilder('task')
      .select("DATE(task.updatedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('task.assignedToUserId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .andWhere('task.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE(task.updatedAt)")
      .orderBy("DATE(task.updatedAt)", 'ASC')
      .getRawMany();

    return completions.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));
  }

  private async getWeeklyCompletions(userId: string, startDate: Date, endDate: Date) {
    const completions = await this.taskRepository
      .createQueryBuilder('task')
      .select("DATE_TRUNC('week', task.updatedAt)", 'week')
      .addSelect('COUNT(*)', 'count')
      .where('task.assignedToUserId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .andWhere('task.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE_TRUNC('week', task.updatedAt)")
      .orderBy("DATE_TRUNC('week', task.updatedAt)", 'ASC')
      .getRawMany();

    return completions.map(item => ({
      week: item.week,
      count: parseInt(item.count),
    }));
  }

  private async getMonthlyCompletions(userId: string, startDate: Date, endDate: Date) {
    const completions = await this.taskRepository
      .createQueryBuilder('task')
      .select("DATE_TRUNC('month', task.updatedAt)", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('task.assignedToUserId = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .andWhere('task.updatedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy("DATE_TRUNC('month', task.updatedAt)")
      .orderBy("DATE_TRUNC('month', task.updatedAt)", 'ASC')
      .getRawMany();

    return completions.map(item => ({
      month: item.month,
      count: parseInt(item.count),
    }));
  }
}