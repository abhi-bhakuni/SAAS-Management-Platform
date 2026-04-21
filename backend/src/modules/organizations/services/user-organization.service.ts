import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserOrganizationMembership, OrganizationRole } from '../../users/entities/user-organization-membership.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { OrganizationMembershipRepository } from '../../users/repositories/organization-membership.repository';

@Injectable()
export class UserOrganizationService {
  private readonly logger = new Logger(UserOrganizationService.name);
  constructor(
    private membershipRepository: OrganizationMembershipRepository,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Add user to organization with specified role
   */
  async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: OrganizationRole = OrganizationRole.MEMBER,
  ): Promise<UserOrganizationMembership> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Verify organization exists
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    // Check if already a member
    const existingMembership = await this.membershipRepository.findByUserAndOrg(
      userId,
      organizationId,
    );
    if (existingMembership) {
      throw new ConflictException(`User is already a member of this organization`);
    }

    // Create membership
    const membership = this.membershipRepository.create({
      userId,
      organizationId,
      role,
    });

    const savedMembership = await this.membershipRepository.save(membership);

    // Reload with relations
    const reloaded = await this.membershipRepository.findByUserAndOrg(userId, organizationId);
    if (!reloaded) {
      throw new Error('Failed to reload membership after save');
    }
    return reloaded;
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.membershipRepository.findByUserAndOrg(
      userId,
      organizationId,
    );

    if (!membership) {
      throw new NotFoundException(`User is not a member of this organization`);
    }

    await this.membershipRepository.remove(membership);
  }

  /**
   * Update member's role in organization
   */
  async updateMemberRole(
    userId: string,
    organizationId: string,
    newRole: OrganizationRole,
  ): Promise<UserOrganizationMembership> {
    const membership = await this.membershipRepository.findByUserAndOrg(
      userId,
      organizationId,
    );

    if (!membership) {
      throw new NotFoundException(`User is not a member of this organization`);
    }

    membership.role = newRole;
    const updated = await this.membershipRepository.save(membership);

    const reloaded = await this.membershipRepository.findByUserAndOrg(userId, organizationId);
    if (!reloaded) {
      throw new Error('Failed to reload membership after save');
    }
    return reloaded;
  }

  /**
   * Get all members of organization (paginated)
   */
  async getOrgMembers(
    organizationId: string,
    page = 1,
    limit = 20,
  ): Promise<any> {
    return this.membershipRepository.findOrgMembers(organizationId, page, limit);
  }

  /**
   * Get all organization memberships for a user
   */
  async getUserOrganizations(userId: string): Promise<UserOrganizationMembership[]> {
    return this.membershipRepository.findByUserId(userId);
  }

  /**
   * Check if user is member of organization
   */
  async isUserMemberOfOrg(userId: string, organizationId: string): Promise<boolean> {
    return this.membershipRepository.isMember(userId, organizationId);
  }

  /**
   * Get user's role in organization
   */
  async getUserOrgRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationRole | null> {
    return this.membershipRepository.findOrgRole(userId, organizationId);
  }

  /**
   * Check if user has at least given role in organization
   */
  async userHasOrgRole(
    userId: string,
    organizationId: string,
    minRole: OrganizationRole,
  ): Promise<boolean> {
    return this.membershipRepository.hasAtLeastRole(userId, organizationId, minRole);
  }

  /**
   * Get owners of organization
   */
  async getOrgOwners(organizationId: string): Promise<UserOrganizationMembership[]> {
    return this.membershipRepository.findOrgMembersByRole(
      organizationId,
      OrganizationRole.OWNER,
    );
  }

  /**
   * Get admins and owners of organization
   */
  async getOrgAdmins(organizationId: string): Promise<UserOrganizationMembership[]> {
    const admins = await this.membershipRepository.findOrgMembersByRole(
      organizationId,
      OrganizationRole.ADMIN,
    );
    const owners = await this.membershipRepository.findOrgMembersByRole(
      organizationId,
      OrganizationRole.OWNER,
    );
    return [...owners, ...admins];
  }

  /**
   * Count members in organization
   */
  async countOrgMembers(organizationId: string): Promise<number> {
    return this.membershipRepository.countOrgMembers(organizationId);
  }

  /**
   * Transfer organization ownership
   */
  async transferOwnership(
    fromUserId: string,
    toUserId: string,
    organizationId: string,
  ): Promise<void> {
    // Verify from user is OWNER
    const fromMembership = await this.membershipRepository.findByUserAndOrg(
      fromUserId,
      organizationId,
    );
    if (!fromMembership || fromMembership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenException(`User is not owner of this organization`);
    }

    // Verify to user is member
    const toMembership = await this.membershipRepository.findByUserAndOrg(
      toUserId,
      organizationId,
    );
    if (!toMembership) {
      throw new NotFoundException(`Target user is not a member of this organization`);
    }

    // Transfer ownership
    fromMembership.role = OrganizationRole.ADMIN;
    toMembership.role = OrganizationRole.OWNER;

    await this.membershipRepository.save([fromMembership, toMembership]);
  }
}
