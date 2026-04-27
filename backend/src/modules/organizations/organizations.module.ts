import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './services/organizations.service';
import { OrganizationsController } from './controllers/organizations.controller';
import { OrganizationInvitesService } from './services/organization-invites.service';
import { OrganizationInvitesController } from './controllers/organization-invites.controller';
import { OrganizationMembersController } from './controllers/organization-members.controller';
import { UserOrganizationService } from './services/user-organization.service';
import { Organization } from './entities/organization.entity';
import { OrganizationInvite } from './entities/organization-invite.entity';
import { User } from '../users/entities/user.entity';
import { UserOrganizationMembership } from '../users/entities/user-organization-membership.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../projects/entities/task.entity';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { AuditLog } from '../../common/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationInvite,
      User,
      UserOrganizationMembership,
      Project,
      Task,
      AuditLog,
    ]),
    forwardRef(() => UsersModule),
    EmailModule,
  ],
  controllers: [OrganizationMembersController, OrganizationsController, OrganizationInvitesController],
  providers: [OrganizationsService, OrganizationInvitesService, UserOrganizationService],
  exports: [OrganizationsService, OrganizationInvitesService, UserOrganizationService],
})
export class OrganizationsModule {}
