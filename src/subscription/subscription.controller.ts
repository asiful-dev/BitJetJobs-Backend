import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  type RawBodyRequest,
  Logger,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import Stripe from 'stripe';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post('checkout')
  async createCheckoutSession(
    @Body('userId') userId: number,
    @Body('planId') planId: string,
  ): Promise<Stripe.Checkout.Session> {
    this.logger.log(`Received request to create checkout session for user ${userId} and plan ${planId}`);
    try {
      const session = await this.subscriptionService.createCheckoutSession(
        userId,
        planId,
      );
      this.logger.log(`Checkout session created: ${session.url}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Failed to create checkout session.');
    }
  }

  @Post('stripe-webhook')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.error('Webhook payload is missing the raw body. Make sure raw body parsing is enabled for this route.');
      throw new BadRequestException('Raw body is required for Stripe signature verification.');
    }

    if (!signature) {
      this.logger.error('Stripe signature is missing from the request headers.');
      throw new BadRequestException('Stripe signature header is required.');
    }

    this.logger.log('Received Stripe webhook event.');

    try {
      await this.subscriptionService.handleStripeWebhook(
        req.rawBody.toString(),
        signature,
      );
      this.logger.log('Webhook event handled successfully.');
      return { received: true };
    } catch (error) {
      this.logger.error(`Error handling webhook: ${error.message}`);
      throw new BadRequestException('Webhook processing failed.');
    }
  }
}
