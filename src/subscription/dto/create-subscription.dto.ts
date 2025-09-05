import { IsNotEmpty, IsString } from "class-validator";

export class CreateSubscriptionDto {
    @IsNotEmpty()
    @IsString()
    planId: string
}
