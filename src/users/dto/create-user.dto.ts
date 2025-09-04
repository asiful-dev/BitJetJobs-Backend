import { IsString, IsEmail, MinLength, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
    message: 'Password must contain at least one number, one lowercase letter, one uppercase letter, and one special character (!@#$%^&*).'
  })
  password: string;

  @IsString()
  passwordConfirmation: string;
}
