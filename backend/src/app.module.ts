import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ActivityModule } from './modules/activity/activity.module';
import { ChatModule } from './modules/chat/chat.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    OrganizationsModule,
    ProjectsModule,
    WebSocketModule,
    ActivityModule,
    ChatModule,
    SandboxModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
