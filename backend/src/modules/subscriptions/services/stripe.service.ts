import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');


@Injectable()
export class StripeService {
  private stripe: Stripe.Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new (Stripe as any)(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  // Create or retrieve a Stripe customer
  async createOrRetrieveCustomer(email: string, name: string) {
    try {
      // Check if customer already exists
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      this.logger.log(`Created new Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating/retrieving Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        metadata,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(`Created Stripe subscription: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      this.logger.log(`Cancelled Stripe subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error cancelling Stripe subscription:', error);
      throw error;
    }
  }

  // Reactivate a cancelled subscription
  async reactivateSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      this.logger.log(`Reactivated Stripe subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error reactivating Stripe subscription:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      this.logger.error('Error retrieving Stripe subscription:', error);
      throw error;
    }
  }

  // List payment methods for a customer
  async listCustomerPaymentMethods(
    customerId: string,
    type: string = 'card',
  ) {
    try {
      return await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as any,
      });
    } catch (error) {
      this.logger.error('Error listing payment methods for Stripe customer:', error);
      throw error;
    }
  }

  // Create a payment intent for one-time payments
  async createPaymentIntent(amount: number, currency = 'usd', metadata?: Record<string, string>) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Handle webhook events
  async constructEvent(payload: Buffer, signature: string, webhookSecret: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      this.logger.error('Error constructing webhook event:', error);
      throw error;
    }
  }

  // Create a Stripe Checkout hosted session
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>,
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        billing_address_collection: 'auto',
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });
      this.logger.log(`Created Stripe Checkout session: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Error creating Checkout session:', error);
      throw error;
    }
  }

  // Retrieve a Checkout session (used to look up customer from session_id)
  async retrieveCheckoutSession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });
    } catch (error) {
      this.logger.error('Error retrieving Checkout session:', error);
      throw error;
    }
  }

  // Create a Stripe Billing Portal session for self-service subscription management
  async createBillingPortalSession(customerId: string, returnUrl: string) {
    try {
      const configId = await this.getOrCreatePortalConfiguration();
      const sessionParams: any = { customer: customerId, return_url: returnUrl };
      if (configId) sessionParams.configuration = configId;
      const session = await this.stripe.billingPortal.sessions.create(sessionParams);
      this.logger.log(`Created Billing Portal session for customer: ${customerId}`);
      return session;
    } catch (error) {
      this.logger.error('Error creating Billing Portal session:', error);
      throw error;
    }
  }

  private async getOrCreatePortalConfiguration(): Promise<string | null> {
    try {
      const existing = await this.stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
      if (existing.data.length > 0) return existing.data[0].id;

      const config = await this.stripe.billingPortal.configurations.create({
        features: {
          payment_method_update: { enabled: true },
          invoice_history: { enabled: true },
          subscription_cancel: { enabled: true },
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            proration_behavior: 'create_prorations',
            products: [],
          },
        },
        business_profile: {
          headline: 'Manage your subscription',
        },
      } as any);
      this.logger.log(`Created Billing Portal configuration: ${config.id}`);
      return config.id;
    } catch (error) {
      this.logger.warn('Could not get/create portal configuration, using default:', (error as any)?.message);
      return null;
    }
  }

  // List prices (for getting price IDs)
  async listPrices() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
      });
      return prices;
    } catch (error) {
      this.logger.error('Error listing prices:', error);
      throw error;
    }
  }

  // Create a price for a plan
  async createPrice(amount: number, currency = 'usd', interval: 'month' | 'year', productName: string) {
    try {
      // First create a product
      const product = await this.stripe.products.create({
        name: productName,
      });

      // Then create a price
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency,
        recurring: {
          interval,
        },
      });

      return price;
    } catch (error) {
      this.logger.error('Error creating price:', error);
      throw error;
    }
  }
}