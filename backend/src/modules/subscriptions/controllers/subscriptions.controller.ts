import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubscriptionsService, CreateSubscriptionDto } from '../services/subscriptions.service';
import { SubscriptionPlansService } from '../services/subscription-plans.service';
import { StripeService } from '../services/stripe.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  // Get current user's active subscription
  @Get('me')
  async getMySubscription(@Request() req) {
    const userId = req.user.id;
    const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);

    if (!subscription) {
      return { subscription: null, paymentMethod: null };
    }

    let paymentMethod: any = null;
    try {
      const paymentMethods = await this.stripeService.listCustomerPaymentMethods(
        subscription.stripeCustomerId,
        'card',
      );
      paymentMethod = paymentMethods?.data?.[0] ?? null;
    } catch (error) {
      // Ignore missing payment method details
    }

    return { subscription, paymentMethod };
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

  // Create a Stripe Checkout hosted session — redirects user to Stripe's payment page
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: { planId: string; successUrl?: string; cancelUrl?: string },
    @Request() req,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';
    const successUrl = body.successUrl ?? `${frontendUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl ?? `${frontendUrl}/settings?checkout=canceled`;
    return this.subscriptionsService.createCheckoutSession(req.user.id, body.planId, successUrl, cancelUrl);
  }

  // Sync subscription from a completed Stripe Checkout session (fallback for local dev / missed webhooks)
  @Post('sync-checkout-session')
  async syncCheckoutSession(@Body() body: { sessionId: string }, @Request() req) {
    if (!body.sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    const session = await this.stripeService.retrieveCheckoutSession(body.sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new BadRequestException('Checkout session is not yet complete');
    }
    await this.subscriptionsService.handleCheckoutSessionCompleted(session);
    return { synced: true };
  }

  // Create a Stripe Billing Portal session — lets user manage/cancel subscription themselves
  @Post('create-portal-session')
  async createPortalSession(
    @Body() body: { returnUrl?: string },
    @Request() req,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';
    const returnUrl = body.returnUrl ?? `${frontendUrl}/settings`;
    return this.subscriptionsService.createBillingPortalSession(req.user.id, returnUrl);
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
