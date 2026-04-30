import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../dtos';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../projects/entities/task.entity';
import { TaskStatus } from '../../../common/enums';
import { AuditLog } from '../../../common/entities/audit-log.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [organizations, total] = await this.organizationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    // Get user counts for each org
    const organizationsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const usersCount = await this.membershipRepository.countBy({ organizationId: org.id });
        return {
          ...org,
          usersCount,
        };
      }),
    );

    return {
      data: organizationsWithCounts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    const usersCount = await this.membershipRepository.countBy({ organizationId: id });

    return {
      ...organization,
      usersCount,
    };
  }

  async findBySlug(slug: string) {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }

    const usersCount = await this.membershipRepository.countBy({ organizationId: organization.id });

    return {
      ...organization,
      usersCount,
    };
  }

  async create(createOrgDto: CreateOrganizationDto) {
    const existingOrg = await this.organizationRepository.findOne({
      where: { slug: createOrgDto.slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization slug already in use');
    }

    const organization = this.organizationRepository.create(createOrgDto);
    organization.settings = organization.settings || {};

    return this.organizationRepository.save(organization);
  }

  async update(id: string, updateOrgDto: UpdateOrganizationDto) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    Object.assign(organization, updateOrgDto);
    return this.organizationRepository.save(organization);
  }

  async remove(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Collect all member user IDs before memberships are cascade-deleted
    const memberships = await this.membershipRepository.find({
      where: { organizationId: id },
      select: ['userId'],
    });
    const memberUserIds = memberships.map((m) => m.userId);

    // Delete subscriptions belonging to org members (no organizationId FK exists on subscriptions)
    if (memberUserIds.length > 0) {
      const { In } = await import('typeorm');
      await this.subscriptionRepository.delete({ userId: In(memberUserIds) });
    }

    // Delete audit log entries for this org
    await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('organizationId = :id', { id })
      .execute();

    // Deleting the org cascades: projects → tasks → task_status_history, memberships
    await this.organizationRepository.remove(organization);
    return { message: 'Organization deleted successfully' };
  }

  async getSettings(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization.settings || {};
  }

  async updateSettings(id: string, settings: Record<string, any>) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    organization.settings = {
      ...organization.settings,
      ...settings,
    };

    return this.organizationRepository.save(organization);
  }

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const org = await this.organizationRepository.findOne({
      where: { slug },
    });
    return !org;
  }

  async getStatistics(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Get user statistics from memberships
    const totalUsers = await this.membershipRepository.countBy({ organizationId: id });

    return {
      totalUsers,
      activeUsers: totalUsers, // All members are active by default (inactive handled separately)
      createdAt: organization.createdAt,
    };
  }

  async getDashboardStats(orgId: string) {
    const now = new Date();
    
    // Current month start and end
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Previous month start and end
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Queries for projects
    const totalProjects = await this.projectRepository.count({ where: { organizationId: orgId } });
    
    const currProjects = await this.projectRepository.count({
      where: {
        organizationId: orgId,
        createdAt: this.getBetweenHelper(startOfCurrentMonth, endOfCurrentMonth)
      }
    });

    const prevProjects = await this.projectRepository.count({
      where: {
        organizationId: orgId,
        createdAt: this.getBetweenHelper(startOfPrevMonth, endOfPrevMonth)
      }
    });

    // Team Size
    const teamSize = await this.membershipRepository.count({ where: { organizationId: orgId } });
    const currTeamMembers = await this.membershipRepository.count({
      where: {
        organizationId: orgId,
        joinedAt: this.getBetweenHelper(startOfCurrentMonth, endOfCurrentMonth)
      }
    });
    const prevTeamMembers = await this.membershipRepository.count({
      where: {
        organizationId: orgId,
        joinedAt: this.getBetweenHelper(startOfPrevMonth, endOfPrevMonth)
      }
    });

    // Queries for tasks
    // First, find all projects for this org so we can fetch their tasks
    const projects = await this.projectRepository.find({ where: { organizationId: orgId }, select: ['id'] });
    const projectIds = projects.map(p => p.id);
    
    let activeTasks = 0;
    let completedTasks = 0;
    
    let currActiveTasks = 0;
    let prevActiveTasks = 0;
    
    let currCompletedTasks = 0;
    let prevCompletedTasks = 0;
    
    let inProgressTaskCount = 0;
    let inReviewTaskCount = 0;

    let recentActivityData: any[] = [];

    if (projectIds.length > 0) {
      // Basic counts
      inProgressTaskCount = await this.taskRepository.count({ where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.IN_PROGRESS } });
      inReviewTaskCount = await this.taskRepository.count({ where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.IN_REVIEW } });
      const todoTaskCount = await this.taskRepository.count({ where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.TODO } });
      
      activeTasks = inProgressTaskCount + inReviewTaskCount + todoTaskCount;
      completedTasks = await this.taskRepository.count({ where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.DONE } });

      // Trend for active tasks
      const inProgressStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW];
      for (const status of inProgressStatuses) {
        currActiveTasks += await this.taskRepository.count({
          where: { projectId: this.getInHelper(projectIds) as any, status, createdAt: this.getBetweenHelper(startOfCurrentMonth, endOfCurrentMonth) }
        });
        prevActiveTasks += await this.taskRepository.count({
          where: { projectId: this.getInHelper(projectIds) as any, status, createdAt: this.getBetweenHelper(startOfPrevMonth, endOfPrevMonth) }
        });
      }

      // Trend for completed tasks
      currCompletedTasks = await this.taskRepository.count({
        where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.DONE, updatedAt: this.getBetweenHelper(startOfCurrentMonth, endOfCurrentMonth) }
      });
      prevCompletedTasks = await this.taskRepository.count({
        where: { projectId: this.getInHelper(projectIds) as any, status: TaskStatus.DONE, updatedAt: this.getBetweenHelper(startOfPrevMonth, endOfPrevMonth) }
      });

    }

    // Recent project/task activity — query audit logs directly by entityType
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentAuditLogs = await this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .innerJoin('user.memberships', 'membership', 'membership.organizationId = :orgId', { orgId })
      .where('audit.entityType IN (:...entityTypes)', { entityTypes: ['Project', 'Task', 'TaskStatus'] })
      .andWhere('audit.createdAt >= :oneMonthAgo', { oneMonthAgo })
      .orderBy('audit.createdAt', 'DESC')
      .limit(2)
      .getMany();

    const timeAgo = (date: Date) => {
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      let interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + ' days ago';
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + ' hours ago';
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + ' mins ago';
      return Math.floor(seconds) + ' seconds ago';
    };

    recentActivityData = recentAuditLogs.map((log) => {
      const payload = log.description || {};
      const entityTypeLower = log.entityType?.toLowerCase() || 'item';
      const entityName = payload.title || payload.name || entityTypeLower;
      const actionVerb = log.action?.toLowerCase() || 'updated';
      const action = `${actionVerb}d ${entityTypeLower} "${entityName}"`;
      return {
        id: log.id,
        user: log.user
          ? `${log.user.firstName}${log.user.lastName ? ` ${log.user.lastName}` : ''}`.trim()
          : 'Unknown',
        action,
        timestamp: timeAgo(log.createdAt),
      };
    });

    const computeTrend = (curr: number, prev: number, label: string) => {
      const diff = curr - prev;
      if (prev === 0) {
        return diff > 0 ? `+${diff} ${label}` : `0 ${label}`;
      }
      const percent = Math.round((diff / prev) * 100);
      return diff >= 0 ? `+${percent}% ${label}` : `${percent}% ${label}`;
    };

    return {
      stats: {
        totalProjects,
        activeTasks,
        completedTasks,
        teamSize
      },
      trends: {
        totalProjects: computeTrend(currProjects, prevProjects, 'this month'),
        activeTasks: computeTrend(currActiveTasks, prevActiveTasks, 'this month'),
        completedTasks: computeTrend(currCompletedTasks, prevCompletedTasks, 'this month'),
        teamSize: computeTrend(currTeamMembers, prevTeamMembers, 'this month'),
      },
      recentActivity: recentActivityData,
      projectStatus: [
        {
            name: "Completed",
            value: completedTasks
        },
        {
            name: "In Progress",
            value: inProgressTaskCount
        },
        {
            name: "Review",
            value: inReviewTaskCount
        }
      ]
    };
  }

  private getBetweenHelper(startDate: Date, endDate: Date): any {
    // Importing Between from typeorm correctly at the top is cleaner, but this avoids more chunk issues.
    const { Between } = require('typeorm');
    return Between(startDate, endDate);
  }

  private getInHelper(values: string[]): any {
    const { In } = require('typeorm');
    return In(values);
  }

}
