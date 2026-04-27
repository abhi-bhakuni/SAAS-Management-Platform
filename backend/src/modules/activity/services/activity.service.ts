import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog } from '@common/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';
import { CreateActivityDto } from '../dtos/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createActivity(
    userId: string,
    createActivityDto: CreateActivityDto,
    request?: Request,
  ) {
    const ipAddress = request?.headers?.['x-forwarded-for']
      ? String(request.headers['x-forwarded-for']).split(',')[0].trim()
      : request?.ip ?? 'system';

    const userAgent = Array.isArray(request?.headers?.['user-agent'])
      ? request.headers['user-agent'][0]
      : request?.headers?.['user-agent'] ?? 'system';

    const auditLog = this.auditLogRepository.create({
      userId: userId ?? undefined,
      projectId: createActivityDto.projectId ?? undefined,
      action: createActivityDto.action,
      entityType: createActivityDto.entityType,
      entityId: createActivityDto.entityId,
      description: createActivityDto.description ?? undefined,
      ipAddress,
      userAgent,
    } as DeepPartial<AuditLog>);

    return this.auditLogRepository.save(auditLog);
  }

  async getActivityForOrg(orgId: string, projectId?: string) {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.user', 'user')
      .addSelect(['user.firstName', 'user.lastName', 'user.email'])
      .orderBy('audit.createdAt', 'DESC')
      .limit(100);

    if (projectId) {
      // Project-scoped: logs tagged with this project OR the project's own entity log
      query.where(
        '(audit.projectId = :projectId) OR (audit.entityType = :projectType AND audit.entityId = :projectId)',
        { projectId, projectType: 'Project' },
      );
    } else {
      // Org-scoped: current-member logs OR org-tagged logs (e.g. removed members)
      const users = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.memberships', 'membership')
        .where('membership.organizationId = :orgId', { orgId })
        .select(['user.id'])
        .getMany();

      const userIds = users.map(u => u.id);

      if (userIds.length > 0) {
        query.where(
          '(audit.userId IN (:...userIds)) OR (audit.organizationId = :orgId)',
          { userIds, orgId },
        );
      } else {
        query.where('audit.organizationId = :orgId', { orgId });
      }
    }

    const auditLogs = await query.getMany();

    // Transform to activity format
    return auditLogs.map(log => {
      const payload = log.description || {};
      let entityName = 'Unknown';
      const entityTypeLower = log.entityType.toLowerCase();

      if (entityTypeLower === 'userinvite') {
        entityName = `${payload.firstName}${payload.lastName ? ' ' + payload.lastName : ''}` || 'New Member';
      } else if (entityTypeLower === 'member') {
        entityName = `${payload.firstName}${payload.lastName ? ' ' + payload.lastName : ''}` || payload.email || 'Member';
      } else if (entityTypeLower === 'project') {
        entityName = payload.name || 'Project';
      } else if (entityTypeLower === 'user') {
        entityName = `${payload.firstName}${payload.lastName ? ' ' + payload.lastName : ''}` || 'User';
      } else {
        entityName = payload.title || payload.name || 'Task';
      }

      return {
        id: log.id,
        type: this.mapActionToType(log),
        description: this.generateDescription(log),
        user: log.user ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}` : 'Unknown',
        avatar: log.user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user.email}` : '',
        timestamp: log.createdAt,
        targetName: log.entityType,
        targetId: log.entityId,
        name: entityName,
        color: this.getColorForAction(log.action, log.entityType),
        detail: JSON.stringify(payload),
      };
    });
  }

  private mapActionToType(log: AuditLog): string {
    const entity = log.entityType.toLowerCase();
    if (entity === 'userinvite') return 'userinvite_accepted';
    if (entity === 'member' && log.action === 'DELETE') return 'member_removed';
    switch (log.action) {
      case 'CREATE': return `${entity}_created`;
      case 'UPDATE':
        if (entity === 'taskstatus') return 'task_status_updated';
        return `${entity}_updated`;
      case 'DELETE': return `${entity}_deleted`;
      case 'LOGIN': return 'user_login';
      default: return 'activity';
    }
  }

  private generateDescription(log: AuditLog): string {
    let entity = log.entityType.toLowerCase();
    if (entity === 'userinvite') return 'joined the workspace via invite';
    if (entity === 'member' && log.action === 'DELETE') {
      return `removed from the workspace`;
    }
    if (entity === 'taskstatus') entity = 'task status';

    switch (log.action) {
      case 'CREATE': return `created a new ${entity}`;
      case 'UPDATE': return `updated ${entity}`;
      case 'DELETE': return `deleted ${entity}`;
      case 'LOGIN': return 'logged in';
      default: return `${log.action.toLowerCase()} ${entity}`;
    }
  }

  private getColorForAction(action: string, entityType?: string): string {
    if (entityType?.toLowerCase() === 'userinvite') return '#8B5CF6';
    switch (action) {
      case 'CREATE': return '#10B981';
      case 'UPDATE': return '#F59E0B';
      case 'DELETE': return '#EF4444';
      case 'LOGIN': return '#3B82F6';
      default: return '#6B7280';
    }
  }
}