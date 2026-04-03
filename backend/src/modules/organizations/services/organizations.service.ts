import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../dtos';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganizationMembership)
    private readonly membershipRepository: Repository<UserOrganizationMembership>,
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
}
