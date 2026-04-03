import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../services/subscriptions.service';

export interface SubscriptionGuardOptions {
  feature?: string;
  requireActiveSubscription?: boolean;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userId = user.id;

    // Get metadata from decorator
    const feature = this.reflector.get<string>('subscriptionFeature', context.getHandler());
    const requireActiveSubscription = this.reflector.get<boolean>('requireActiveSubscription', context.getHandler());

    // If requiring active subscription, check if user has one
    if (requireActiveSubscription) {
      const subscription = await this.subscriptionsService.getUserActiveSubscription(userId);
      if (!subscription) {
        throw new ForbiddenException('Active subscription required');
      }
    }

    // If specific feature required, check access
    if (feature) {
      const hasAccess = await this.subscriptionsService.hasFeatureAccess(userId, feature);
      if (!hasAccess) {
        throw new ForbiddenException(`Feature '${feature}' not available in your subscription plan`);
      }
    }

    return true;
  }
}

// Decorator to require subscription feature access
export const RequireSubscription = (feature?: string, requireActiveSubscription = false) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('subscriptionFeature', feature, descriptor.value);
    Reflect.defineMetadata('requireActiveSubscription', requireActiveSubscription, descriptor.value);
  };
};