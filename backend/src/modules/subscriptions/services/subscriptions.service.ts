import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { UserOrganizationMembership } from '../../users/entities/user-organization-membership.entity';
import { OrganizationRole } from '../../../common/enums';
import { StripeService } from './stripe.service';
import { SubscriptionPlansService } from './subscription-plans.service';

export interface CreateSubscriptionDto {
  userId: string;
  subscriptionPlanId: string;
  paymentMethodId?: string;
}

export interface UpdateSubscriptionDto {
  status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserOrganizationMembership)
    private membershipRepository: Repository<UserOrganizationMembership>,
    private stripeService: StripeService,
    private subscriptionPlansService: SubscriptionPlansService,
  ) {}

  // Create a new subscription
  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { userId, subscriptionPlanId, paymentMethodId } = createSubscriptionDto;

    // Get user and plan
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.subscriptionPlansService.findOne(subscriptionPlanId);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    try {
      // Create or retrieve Stripe customer
      const customer = await this.stripeService.createOrRetrieveCustomer(user.email, user.getFullName());

      // Create subscription in database first
      const subscription = this.subscriptionRepository.create({
        userId,
        subscriptionPlanId,
        stripeCustomerId: customer.id,
        status: SubscriptionStatus.INCOMPLETE,
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);

      // Create Stripe subscription
      const stripeSubscription = await this.stripeService.createSubscription(
        customer.id,
        plan.stripePriceId,
        {
          subscriptionId: savedSubscription.id,
          userId,
        },
      ) as any;

      // Update subscription with Stripe data
      savedSubscription.stripeSubscriptionId = stripeSubscription.id;
      savedSubscription.status = this.mapStripeStatus(stripeSubscription.status);
      savedSubscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      savedSubscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

      if (stripeSubscription.trial_start) {
        savedSubscription.trialStart = new Date(stripeSubscription.trial_start * 1000);
      }
      if (stripeSubscription.trial_end) {
        savedSubscription.trialEnd = new Date(stripeSubscription.trial_end * 1000);
      }

      return await this.subscriptionRepository.save(savedSubscription);
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw new BadRequestException('Failed to create subscription');
    }
  }

  // Get user's active subscription
  async getUserActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['subscriptionPlan'],
    });
  }

  // Get all user subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      relations: ['subscriptionPlan'],
      order: { createdAt: 'DESC' },
    });
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

    try {
      // Cancel in Stripe
      await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

      // Update local record
      subscription.cancelAtPeriodEnd = true;
      subscription.canceledAt = new Date();

      return await this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.logger.error('Error canceling subscription:', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE && !subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is already active');
    }

    try {
      // Reactivate in Stripe
      await this.stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

      // Update local record
      subscription.cancelAtPeriodEnd = false;
      subscription.canceledAt = null;

      return await this.subscriptionRepository.save(subscription);
    } catch (error) {
      this.logger.error('Error reactivating subscription:', error);
      throw new BadRequestException('Failed to reactivate subscription');
    }
  }

  // Update subscription from Stripe webhook
  async updateSubscriptionFromWebhook(stripeSubscription: any) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    subscription.status = this.mapStripeStatus(stripeSubscription.status);
    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

    if (stripeSubscription.canceled_at) {
      subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
    }

    if (stripeSubscription.trial_start) {
      subscription.trialStart = new Date(stripeSubscription.trial_start * 1000);
    }
    if (stripeSubscription.trial_end) {
      subscription.trialEnd = new Date(stripeSubscription.trial_end * 1000);
    }

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Updated subscription ${subscription.id} from webhook`);
  }

  // Create a Stripe Checkout hosted session for a plan upgrade
  async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.subscriptionPlansService.findOne(planId);
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.stripePriceId) throw new BadRequestException('This plan has no associated Stripe price');

    try {
      const customer = await this.stripeService.createOrRetrieveCustomer(user.email, user.getFullName());
      const session = await this.stripeService.createCheckoutSession(
        customer.id,
        plan.stripePriceId,
        successUrl,
        cancelUrl,
        { userId, planId },
      );
      return { url: session.url, sessionId: session.id };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  // Create a Stripe Billing Portal session for self-service management
  async createBillingPortalSession(userId: string, returnUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    try {
      // Use the customer ID from the most recent subscription; create one if none exists
      const subscription = await this.subscriptionRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      let customerId: string;
      if (subscription?.stripeCustomerId) {
        customerId = subscription.stripeCustomerId;
      } else {
        const customer = await this.stripeService.createOrRetrieveCustomer(user.email, user.getFullName());
        customerId = customer.id;
      }

      const session = await this.stripeService.createBillingPortalSession(customerId, returnUrl);
      return { url: session.url };
    } catch (error) {
      this.logger.error('Error creating billing portal session:', error);
      throw new BadRequestException('Failed to create billing portal session');
    }
  }

  // Sync local subscription record from a completed Checkout session
  async handleCheckoutSessionCompleted(session: any) {
    const { userId, planId } = session.metadata ?? {};
    if (!userId || !planId) {
      this.logger.warn('Checkout session missing userId/planId metadata');
      return;
    }

    const stripeSubscription = session.subscription as any;
    if (!stripeSubscription) return;

    // Upsert: update existing INCOMPLETE record or create a fresh one
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId, subscriptionPlanId: planId },
    });

    if (!subscription) {
      subscription = this.subscriptionRepository.create({ userId, subscriptionPlanId: planId });
    }

    subscription.stripeCustomerId = session.customer;
    subscription.stripeSubscriptionId = typeof stripeSubscription === 'string' ? stripeSubscription : stripeSubscription.id;
    subscription.status = this.mapStripeStatus(stripeSubscription.status ?? 'active');
    if (stripeSubscription.current_period_start) {
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    }

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Subscription synced from checkout session ${session.id}`);
  }

  // Get plan limits for an organization (based on the org admin's active subscription)
  async getOrgPlanLimits(orgId: string): Promise<{ users: number; projects: number; tasks: number }> {
    const freePlan = await this.subscriptionPlansService.getFreePlan();
    const freeLimits = {
      users: freePlan?.limits?.['users'] ?? 5,
      projects: freePlan?.limits?.['projects'] ?? 3,
      tasks: freePlan?.limits?.['tasks'] ?? 20,
    };

    const adminMembership = await this.membershipRepository.findOne({
      where: { organizationId: orgId, role: OrganizationRole.ADMIN },
    });

    if (!adminMembership) return freeLimits;

    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: adminMembership.userId, status: SubscriptionStatus.ACTIVE },
      relations: ['subscriptionPlan'],
    });

    if (!subscription?.subscriptionPlan?.limits) return freeLimits;

    const planLimits = subscription.subscriptionPlan.limits;
    return {
      users: planLimits['users'] ?? freeLimits.users,
      projects: planLimits['projects'] ?? freeLimits.projects,
      tasks: planLimits['tasks'] ?? freeLimits.tasks,
    };
  }

  // Check if user has access to a feature
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);

    if (!subscription) {
      // Check if feature is available in free plan
      const freePlan = await this.subscriptionPlansService.getFreePlan();
      return freePlan?.features?.includes(feature) || false;
    }

    return subscription.subscriptionPlan.features?.includes(feature) || false;
  }

  // Check if user is within plan limits
  async checkPlanLimits(userId: string, resourceType: 'users' | 'projects' | 'tasks', currentCount: number): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);

    if (!subscription) {
      // Check free plan limits
      const freePlan = await this.subscriptionPlansService.getFreePlan();
      const limit = freePlan?.limits?.[resourceType] || 0;
      return currentCount < limit;
    }

    const limit = subscription.subscriptionPlan.limits?.[resourceType] || 0;
    return currentCount < limit;
  }

  // Map Stripe subscription status to our enum
  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  // Legacy methods for backward compatibility
  async findAll(page = 1, limit = 10) {
    const [subscriptions, total] = await this.subscriptionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'subscriptionPlan'],
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: subscriptions,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'subscriptionPlan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByUser(userId: string) {
    return this.getUserSubscriptions(userId);
  }
}
