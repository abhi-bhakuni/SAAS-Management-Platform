import { dataSource } from '../../config/database.config';
import { User } from '../../modules/users/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription-plan.entity';
import { SubscriptionPlansService } from '../../modules/subscriptions/services/subscription-plans.service';
import { UserOrganizationMembership } from '../../modules/users/entities/user-organization-membership.entity';
import { OrganizationRole, OrganizationStatus, SubscriptionStatus } from '../../common/enums';
import * as bcrypt from 'bcrypt';

async function seed() {
  await dataSource.initialize();

  console.log('🌱 Starting database seeding...');

  try {
    // Create organizations
    const orgRepo = dataSource.getRepository(Organization);
    const org1 = await orgRepo.save(
      orgRepo.create({
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'Leading enterprise software provider',
        website: 'https://acme.example.com',
        industry: 'Technology',
        status: OrganizationStatus.ACTIVE,
      }),
    );

    const org2 = await orgRepo.save(
      orgRepo.create({
        name: 'TechStart Inc',
        slug: 'techstart',
        description: 'Innovative startup ecosystem',
        website: 'https://techstart.example.com',
        industry: 'Startups',
        status: OrganizationStatus.ACTIVE,
      }),
    );

    console.log('✓ Organizations created');

    // Create users
    const userRepo = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const user1 = await userRepo.save(
      userRepo.create({
        email: 'admin@acme.example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: hashedPassword,
        role: OrganizationRole.ADMIN,
        emailVerified: true,
        isActive: true,
      }),
    );

    const user2 = await userRepo.save(
      userRepo.create({
        email: 'user@acme.example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: hashedPassword,
        role: OrganizationRole.MANAGER,
        emailVerified: true,
        isActive: true,
      }),
    );

    const user3 = await userRepo.save(
      userRepo.create({
        email: 'admin@techstart.example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        password: hashedPassword,
        role: OrganizationRole.ADMIN,
        emailVerified: true,
        isActive: true,
      }),
    );

    console.log('✓ Users created');

    // Create organization memberships
    const membershipRepo = dataSource.getRepository(UserOrganizationMembership);

    await membershipRepo.save(
      membershipRepo.create({
        userId: user1.id,
        organizationId: org1.id,
        role: OrganizationRole.ADMIN,
      }),
    );

    await membershipRepo.save(
      membershipRepo.create({
        userId: user2.id,
        organizationId: org1.id,
        role: OrganizationRole.MEMBER,
      }),
    );

    await membershipRepo.save(
      membershipRepo.create({
        userId: user3.id,
        organizationId: org2.id,
        role: OrganizationRole.ADMIN,
      }),
    );

    console.log('✓ Organization memberships created');

    // Initialize subscription plans
    const planService = new SubscriptionPlansService(dataSource.getRepository(SubscriptionPlan));
    await planService.initializeDefaultPlans();
    console.log('✓ Subscription plans initialized');

    // Note: Subscriptions will be created by users through the API
    // The seed no longer creates subscriptions directly

    console.log('✅ Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Email: admin@acme.example.com');
    console.log('Password: Password123!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
