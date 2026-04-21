import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@common/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
    return auditLogs.map(log => ({
      id: log.id,
      type: this.mapActionToType(log.action),
      description: this.generateDescription(log),
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
      avatar: log.user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user.email}` : '',
      timestamp: log.createdAt,
      targetName: log.entityType,
      targetId: log.entityId,
      project: 'Project Name', // TODO: get from entity
      color: this.getColorForAction(log.action),
      detail: JSON.stringify(log.changes),
    }));
  }

  private mapActionToType(action: string): string {
    switch (action) {
      case 'CREATE': return 'task_created';
      case 'UPDATE': return 'task_updated';
      case 'DELETE': return 'task_deleted';
      case 'LOGIN': return 'user_login';
      default: return 'activity';
    }
  }

  private generateDescription(log: AuditLog): string {
    const entity = log.entityType.toLowerCase();
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