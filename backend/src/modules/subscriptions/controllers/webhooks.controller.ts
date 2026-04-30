import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../services/stripe.service';
import { SubscriptionsService } from '../services/subscriptions.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private configService: ConfigService,
    private stripeService: StripeService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    try {
      // Verify and construct the event
      const event = await this.stripeService.constructEvent(rawBody, signature, webhookSecret);

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'entitlements.active_entitlement_summary.updated':
          this.logger.log(`Active entitlement summary updated for customer: ${event.data.object.customer}`);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async handleCheckoutSessionCompleted(session: any) {
    try {
      await this.subscriptionsService.handleCheckoutSessionCompleted(session);
      this.logger.log(`Checkout session completed: ${session.id}`);
    } catch (error) {
      this.logger.error('Error handling checkout session completed:', error);
    }
  }

  private async handleSubscriptionUpdate(stripeSubscription: any) {
    try {
      await this.subscriptionsService.updateSubscriptionFromWebhook(stripeSubscription);
      this.logger.log(`Updated subscription ${stripeSubscription.id}`);
    } catch (error) {
      this.logger.error('Error updating subscription from webhook:', error);
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: any) {
    try {
      // Mark subscription as canceled
      const subscription = await this.subscriptionsService.updateSubscriptionFromWebhook(stripeSubscription);
      this.logger.log(`Marked subscription ${stripeSubscription.id} as canceled`);
    } catch (error) {
      this.logger.error('Error handling subscription deletion:', error);
    }
  }

  private async handlePaymentSucceeded(invoice: any) {
    try {
      // Payment succeeded - subscription should be active
      if (invoice.subscription) {
        const subscription = await this.subscriptionsService.updateSubscriptionFromWebhook({
          id: invoice.subscription,
          status: 'active',
          current_period_start: invoice.period_start,
          current_period_end: invoice.period_end,
        });
        this.logger.log(`Payment succeeded for subscription ${invoice.subscription}`);
      }
    } catch (error) {
      this.logger.error('Error handling payment succeeded:', error);
    }
  }

  private async handlePaymentFailed(invoice: any) {
    try {
      // Payment failed - subscription might be past due
      if (invoice.subscription) {
        const subscription = await this.subscriptionsService.updateSubscriptionFromWebhook({
          id: invoice.subscription,
          status: 'past_due',
          current_period_start: invoice.period_start,
          current_period_end: invoice.period_end,
        });
        this.logger.log(`Payment failed for subscription ${invoice.subscription}`);
      }
    } catch (error) {
      this.logger.error('Error handling payment failed:', error);
    }
  }

  private async handleTrialWillEnd(stripeSubscription: any) {
    try {
      // Trial is ending soon - could send notification to user
      this.logger.log(`Trial ending soon for subscription ${stripeSubscription.id}`);

      // Here you could send an email notification to the user
      // about their trial ending and payment required

    } catch (error) {
      this.logger.error('Error handling trial will end:', error);
    }
  }
}