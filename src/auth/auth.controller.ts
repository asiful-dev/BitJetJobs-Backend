// src/auth/auth.controller.ts
import { Body, Controller, Post, UsePipes, ValidationPipe, UseGuards, Get, Request, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImage'))
  async register(@Body() body: any,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    if (!profileImage) {
      throw new HttpException('Profile image is required.', HttpStatus.BAD_REQUEST);
    }
    // Manually create and validate the DTO from the request body
    const createUserDto = plainToClass(CreateUserDto, body);

    const errors = await validate(createUserDto);

    if (errors.length > 0) {
      const messages = errors.flatMap(error => Object.values(error.constraints || {}));
      throw new HttpException({
        message: messages,
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      }, HttpStatus.BAD_REQUEST);
    }

    return this.authService.register(createUserDto, profileImage);
  }

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('request-otp')
  async requestOtp(@Body('email') email: string) {
    return this.authService.generateAndSendOtp(email);
  }

  @Post('verify-otp')
  @UsePipes(ValidationPipe)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otpCode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}