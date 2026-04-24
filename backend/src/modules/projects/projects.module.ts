import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganizationMembership } from '../users/entities/user-organization-membership.entity';
import { ProjectsService } from './services/projects.service';
import { TasksService } from './services/tasks.service';
import { ProjectsController } from './controllers/projects.controller';
import { TasksController } from './controllers/tasks.controller';
import { TasksGateway } from '../websocket/tasks.gateway';
import { WebSocketModule } from '../websocket/websocket.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, TaskStatusHistory, Organization, UserOrganizationMembership]),
    WebSocketModule,
    ActivityModule
  ],
  controllers: [ProjectsController, TasksController],
  providers: [ProjectsService, TasksService],
  exports: [ProjectsService, TasksService],
})
export class ProjectsModule {}
