import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './controllers/activity.controller';
import { ActivityService } from './services/activity.service';
import { AuditLog } from '@common/entities/audit-log.entity';
import { User } from '@modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User])],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}