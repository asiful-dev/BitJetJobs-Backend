import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { RawBodyMiddleware } from './middlewares/raw-body.middleware';



@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    CloudinaryModule,
    SubscriptionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes('subscription/stripe'); // Apply to the Stripe webhook route
  }
 }
