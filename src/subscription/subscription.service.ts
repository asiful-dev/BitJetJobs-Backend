import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from 'src/users/users.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = this.configService.get("STRIPE_SECRET_KEY");
    if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not defined in the configuration.');
    // Initialize Stripe with the secret key from environment variables
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-08-27.basil"
    });
  }

  /**
   * Creates a Stripe Customer for the user if one doesn't already exist.
   * @param userId - The user's ID from your database.
   * @returns The Stripe Customer ID.
   */
  private async getOrCreateStripeCustomer(userId: number): Promise<string> {
    const user = await this.databaseService.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.stripeCustomerId) {
      this.logger.log(`Using existing Stripe customer ID for user ${userId}`);
      return user.stripeCustomerId;
    }

    // Create a new customer in Stripe
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    // Update the user in your database with the new Stripe customer ID
    await this.databaseService.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created new Stripe customer ID for user ${userId}`);
    return customer.id;
  }

  /**
   * Creates a new Stripe Checkout Session for the user.
   * This method will be called from the frontend.
   * @param userId - The user's ID.
   * @param planId - The ID of the Stripe Price (plan).
   * @returns A Stripe Session object with the checkout URL.
   */
  async createCheckoutSession(userId: number, planId: string): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.getOrCreateStripeCustomer(userId);

      // You would get the plan price from your database or config here, not directly from the client.
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: planId, // This is the Stripe Price ID
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${this.configService.get('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/cancel`,
      });

      this.logger.log(`Stripe Checkout session created for user ${userId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create Stripe Checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handles Stripe webhook events to update your database.
   * This method is crucial for keeping your app's subscription status in sync with Stripe's.
   * @param payload - The raw payload from the webhook request.
   * @param signature - The signature from the 'stripe-signature' header.
   */
  async handleStripeWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Webhook signature verification failed.');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeSubscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        // Get amount in cents from session, convert to dollars
        if (!session.amount_total) {
          throw new Error('Session amount_total is missing.');
        }
        const price = session.amount_total / 100;

        const user = await this.databaseService.user.findUnique({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          this.logger.error(`Webhook: User not found for Stripe customer ID ${customerId}`);
          return;
        }

        // Create a subscription record in your database
        await this.databaseService.subscription.upsert({
          where: { userId: user.id },
          update: {
            status: 'ACTIVE',
            stripeSubscriptionId,
            planPrice: price,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            planName: 'Annual Plan', // or get from session metadata
          },
          create: {
            userId: user.id,
            status: 'ACTIVE',
            stripeSubscriptionId,
            planPrice: price,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            planName: 'Annual Plan',
            payments: {
              create: {
                amount: price,
                currency: 'usd',
                status: 'SUCCEEDED',
                transactionId: session.id,
              }
            }
          }
        });
        this.logger.log(`Subscription created for user ${user.id} via webhook.`);
        break;
      }
      // Add more cases for other events you want to handle
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await this.databaseService.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELED' },
        });
        this.logger.log(`Subscription for customer ${customerId} was deleted.`);
        break;
      }
      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }
  }
}
