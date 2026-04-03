import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { UserOrganizationMembership } from './entities/user-organization-membership.entity';
import { OrganizationMembershipRepository } from './repositories/organization-membership.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOrganizationMembership])],
  controllers: [UsersController],
  providers: [UsersService, OrganizationMembershipRepository],
  exports: [UsersService, OrganizationMembershipRepository],
})
export class UsersModule {}
