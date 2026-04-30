import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { UserOrganizationMembership } from '../users/entities/user-organization-membership.entity';
import { AuditLog } from '../../common/entities/audit-log.entity';
import { OrganizationsModule } from '../organizations/organizations.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrganizationMembership, AuditLog]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expirationStr = configService.get<string>('JWT_EXPIRATION', '86400');
        const expirationNum = parseInt(expirationStr, 10);
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expirationNum,
            issuer: 'saas-management-app',
            audience: 'saas-management-users',
          },
        };
      },
    }),
    UsersModule,
    EmailModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
