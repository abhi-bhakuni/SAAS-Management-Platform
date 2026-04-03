import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import * as StripeNamespace from 'stripe';

@Injectable()
export class StripeService {
  private stripe: StripeNamespace.Stripe;
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