import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from '../dtos';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * List all projects within an organization (paginated).
   */
  async findAll(organizationId: string, page = 1, limit = 20) {
    const [projects, total] = await this.projectRepository.findAndCount({
      where: { organizationId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: projects.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single project by ID, ensuring it belongs to the organization.
   */
  async findOne(organizationId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
      relations: ['createdBy'],
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${projectId} not found in this organization`,
      );
    }

    return this.toResponse(project);
  }

  /**
   * Create a new project scoped to the organization.
   */
  async create(
    organizationId: string,
    createdByUserId: string,
    dto: CreateProjectDto,
  ) {
    const project = this.projectRepository.create({
      ...dto,
      organizationId,
      createdByUserId,
    });

    const saved = await this.projectRepository.save(project);

    // Re-fetch with relations so the response is complete
    return this.findOne(organizationId, saved.id);
  }

  /**
   * Update an existing project.  Validates it belongs to the org.
   */
  async update(
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${projectId} not found in this organization`,
      );
    }

    Object.assign(project, dto);
    await this.projectRepository.save(project);

    return this.findOne(organizationId, projectId);
  }

  /**
   * Permanently delete a project.  Validates org ownership first.
   */
  async remove(organizationId: string, projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${projectId} not found in this organization`,
      );
    }

    await this.projectRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private toResponse(project: Project) {
    return {
      id: project.id,
      organizationId: project.organizationId,
      createdByUserId: project.createdByUserId ?? null,
      name: project.name,
      description: project.description ?? null,
      status: project.status,
      settings: project.settings ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy
        ? {
            id: project.createdBy.id,
            firstName: project.createdBy.firstName,
            lastName: project.createdBy.lastName,
            email: project.createdBy.email,
          }
        : null,
    };
  }
}
