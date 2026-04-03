import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan, SubscriptionPlanType } from '../entities/subscription-plan.entity';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async findAll(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.planRepository.find({
      where,
      order: {
        price: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.planRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async getFreePlan(): Promise<SubscriptionPlan | null> {
    return this.planRepository.findOne({
      where: { type: 'free', isActive: true },
    });
  }

  async create(planData: Partial<SubscriptionPlan>) {
    const plan = this.planRepository.create(planData);
    return this.planRepository.save(plan);
  }

  async update(id: string, updateData: Partial<SubscriptionPlan>) {
    const plan = await this.findOne(id);
    Object.assign(plan, updateData);
    return this.planRepository.save(plan);
  }

  async delete(id: string) {
    const plan = await this.findOne(id);
    plan.isActive = false;
    return this.planRepository.save(plan);
  }

  // Initialize default plans
  async initializeDefaultPlans() {
    const existingPlans = await this.planRepository.count();

    if (existingPlans > 0) {
      return; // Plans already exist
    }

    // Create Free plan
    await this.create({
      name: 'Free',
      type: 'free',
      description: 'Perfect for small teams getting started',
      price: 0,
      billingCycle: 'monthly',
      isActive: true,
      trialDays: 14,
      features: {
        basicTaskManagement: true,
        basicAnalytics: true,
        emailSupport: true,
      },
      limits: {
        users: 3,
        projects: 2,
        tasks: 50,
      },
    });

    // Create Pro plan
    await this.create({
      name: 'Pro',
      type: 'pro',
      description: 'Advanced features for growing teams',
      price: 29.99,
      billingCycle: 'monthly',
      isActive: true,
      trialDays: 14,
      features: {
        basicTaskManagement: true,
        basicAnalytics: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customIntegrations: true,
        apiAccess: true,
        unlimitedStorage: true,
      },
      limits: {
        users: 50,
        projects: 20,
        tasks: 1000,
      },
    });

    console.log('Default subscription plans initialized');
  }
}