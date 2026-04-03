import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserOrganizationMembership, OrganizationRole } from '../entities/user-organization-membership.entity';

@Injectable()
export class OrganizationMembershipRepository extends Repository<UserOrganizationMembership> {
  constructor(private dataSource: DataSource) {
    super(UserOrganizationMembership, dataSource.createEntityManager());
  }

  /**
   * Find all org memberships for a user
   */
  async findByUserId(userId: string): Promise<UserOrganizationMembership[]> {
    return this.find({
      where: { userId },
      relations: ['organization'],
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * Find all user memberships in an organization
   */
  async findByOrganizationId(organizationId: string): Promise<UserOrganizationMembership[]> {
    return this.find({
      where: { organizationId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Find single membership by user and org
   */
  async findByUserAndOrg(
    userId: string,
    organizationId: string,
  ): Promise<UserOrganizationMembership | null> {
    return this.findOne({
      where: { userId, organizationId },
      relations: ['organization', 'user'],
    });
  }

  /**
   * Get user's role in organization
   */
  async findOrgRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationRole | null> {
    const membership = await this.findOne({
      where: { userId, organizationId },
      select: ['role'],
    });
    return membership?.role || null;
  }

  /**
   * Find all members of an organization (paginated)
   */
  async findOrgMembers(organizationId: string, page = 1, limit = 20): Promise<{
    data: UserOrganizationMembership[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const [members, total] = await this.findAndCount({
      where: { organizationId },
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { joinedAt: 'ASC' },
    });

    return {
      data: members,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Find org members with specific role
   */
  async findOrgMembersByRole(
    organizationId: string,
    role: OrganizationRole,
  ): Promise<UserOrganizationMembership[]> {
    return this.find({
      where: { organizationId, role },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Count members in organization
   */
  async countOrgMembers(organizationId: string): Promise<number> {
    return this.count({
      where: { organizationId },
    });
  }

  /**
   * Check if user is member of organization
   */
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const count = await this.count({
      where: { userId, organizationId },
    });
    return count > 0;
  }

  /**
   * Check if user has at least role in organization
   * Role hierarchy: OWNER > ADMIN > MEMBER
   */
  async hasAtLeastRole(
    userId: string,
    organizationId: string,
    minRole: OrganizationRole,
  ): Promise<boolean> {
    const membership = await this.findOne({
      where: { userId, organizationId },
      select: ['role'],
    });

    if (!membership) return false;

    const roleHierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.ADMIN]: 2,
      [OrganizationRole.MEMBER]: 1,
    };

    return roleHierarchy[membership.role] >= roleHierarchy[minRole];
  }
}
