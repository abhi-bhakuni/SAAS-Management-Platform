import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsService } from './services/subscriptions.service';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { StripeService } from './services/stripe.service';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionPlan, User]),
    ConfigModule,
    UsersModule,
  ],
  controllers: [SubscriptionsController, WebhooksController],
  providers: [SubscriptionsService, SubscriptionPlansService, StripeService],
  exports: [SubscriptionsService, SubscriptionPlansService, StripeService],
})
export class SubscriptionsModule {}
