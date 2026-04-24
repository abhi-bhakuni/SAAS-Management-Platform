import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog } from '@common/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';
import { CreateActivityDto } from '../dtos/create-activity.dto';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
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
      action: createActivityDto.action,
      entityType: createActivityDto.entityType,
      entityId: createActivityDto.entityId,
      description: createActivityDto.description ?? undefined,
      ipAddress,
      userAgent,
    } as DeepPartial<AuditLog>);

    return this.auditLogRepository.save(auditLog);
  }

  async getActivityForOrg(orgId: string) {
    // Get users in the org
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.memberships', 'membership')
      .where('membership.organizationId = :orgId', { orgId })
      .select(['user.id'])
      .getMany();

    const userIds = users.map(u => u.id);

    // Get audit logs for those users
    const auditLogs = await this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.user', 'user')
      .addSelect(['user.firstName', 'user.lastName', 'user.email'])
      .where('audit.userId IN (:...userIds)', { userIds })
      .orderBy('audit.createdAt', 'DESC')
      .limit(100) // Limit to recent 100
      .getMany();

    // Transform to activity format
    return auditLogs.map(log => {
      const payload = log.description || {};
      let entityName = 'Unknown';
      
      if (log.entityType.toLowerCase() === 'project') {
        entityName = payload.name || 'Project';
      } else {
        entityName = payload.title || 'Task';
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
        color: this.getColorForAction(log.action),
        detail: JSON.stringify(payload),
      };
    });
  }

  private mapActionToType(log: AuditLog): string {
    const entity = log.entityType.toLowerCase();
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
    if (entity === 'taskstatus') entity = 'task status';
    
    switch (log.action) {
      case 'CREATE': return `created a new ${entity}`;
      case 'UPDATE': return `updated ${entity}`;
      case 'DELETE': return `deleted ${entity}`;
      case 'LOGIN': return 'logged in';
      default: return `${log.action.toLowerCase()} ${entity}`;
    }
  }

  private getColorForAction(action: string): string {
    switch (action) {
      case 'CREATE': return '#10B981';
      case 'UPDATE': return '#F59E0B';
      case 'DELETE': return '#EF4444';
      case 'LOGIN': return '#3B82F6';
      default: return '#6B7280';
    }
  }
}