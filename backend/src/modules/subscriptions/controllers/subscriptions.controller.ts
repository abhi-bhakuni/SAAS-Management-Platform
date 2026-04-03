import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubscriptionsService, CreateSubscriptionDto } from '../services/subscriptions.service';
import { SubscriptionPlansService } from '../services/subscription-plans.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  // Get current user's active subscription
  @Get('me')
  async getMySubscription(@Request() req) {
    const userId = req.user.id;
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);
    return { subscription };
  }

  // Get all subscriptions for current user
  @Get('my-subscriptions')
  async getMySubscriptions(@Request() req) {
    const userId = req.user.id;
    const subscriptions = await this.subscriptionsService.getUserSubscriptions(userId);
    return { subscriptions };
  }

  // Create a new subscription
  @Post()
  async createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto, @Request() req) {
    const userId = req.user.id;

    // Ensure user can only create subscription for themselves
    if (createSubscriptionDto.userId !== userId) {
      throw new BadRequestException('Cannot create subscription for another user');
    }

    const subscription = await this.subscriptionsService.createSubscription(createSubscriptionDto);
    return { subscription };
  }

  // Cancel current user's subscription
  @Post('cancel')
  async cancelSubscription(@Request() req) {
    const userId = req.user.id;
    const activeSubscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!activeSubscription) {
      throw new BadRequestException('No active subscription found');
    }

    const result = await this.subscriptionsService.cancelSubscription(activeSubscription.id, userId);
    return { message: 'Subscription cancelled successfully', subscription: result };
  }

  // Reactivate current user's subscription
  @Post('reactivate')
  async reactivateSubscription(@Request() req) {
    const userId = req.user.id;
    const subscriptions = await this.subscriptionsService.getUserSubscriptions(userId);
    const canceledSubscription = subscriptions.find(sub => sub.cancelAtPeriodEnd);

    if (!canceledSubscription) {
      throw new BadRequestException('No canceled subscription found to reactivate');
    }

    const result = await this.subscriptionsService.reactivateSubscription(canceledSubscription.id, userId);
    return { message: 'Subscription reactivated successfully', subscription: result };
  }

  // Check if user has access to a feature
  @Get('check-feature/:feature')
  async checkFeatureAccess(@Param('feature') feature: string, @Request() req) {
    const userId = req.user.id;
    const hasAccess = await this.subscriptionsService.hasFeatureAccess(userId, feature);
    return { hasAccess, feature };
  }

  // Check if user is within plan limits
  @Get('check-limit/:resourceType/:currentCount')
  async checkPlanLimits(
    @Param('resourceType') resourceType: 'users' | 'projects' | 'tasks',
    @Param('currentCount') currentCount: string,
    @Request() req
  ) {
    const userId = req.user.id;
    const count = parseInt(currentCount, 10);
    const withinLimits = await this.subscriptionsService.checkPlanLimits(userId, resourceType, count);
    return { withinLimits, resourceType, currentCount: count };
  }

  // Get available subscription plans
  @Get('plans')
  async getSubscriptionPlans() {
    const plans = await this.subscriptionPlansService.findAll();
    return { plans };
  }

  // Get specific subscription plan
  @Get('plans/:id')
  async getSubscriptionPlan(@Param('id') id: string) {
    const plan = await this.subscriptionPlansService.findOne(id);
    return { plan };
  }
}
