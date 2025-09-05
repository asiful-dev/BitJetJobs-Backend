import { IsNumber, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsEnum(PaymentStatus)
    @IsNotEmpty()
    status: PaymentStatus;

    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsNumber()
    @IsNotEmpty()
    subscriptionId: number;
}
