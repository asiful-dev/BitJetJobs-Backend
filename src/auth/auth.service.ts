// src/auth/auth.service.ts
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcryptjs';
import { createTransport } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly configService: ConfigService,
    ) { }

    async register(createUserDto: CreateUserDto, profileImage: Express.Multer.File) {
        try {
            const existingUser = await this.databaseService.user.findUnique({
                where: { email: createUserDto.email },
            });
            if (existingUser) {
                throw new ConflictException('A user with this email already exists.');
            }
    
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const imageUrl = await this.cloudinaryService.uploadImage(profileImage);
    
            console.log(imageUrl);
            
            const user = await this.databaseService.user.create({
                data: {
                    ...createUserDto,
                    password: hashedPassword,
                    avatarUrl: imageUrl.url,
                },
            });
            
            console.log(user);
            this.logger.log(`User registered with email: ${user.email}`);
    
            const { password, ...result } = user;
            return result;
        } catch (error) {
            this.logger.error(`Registration failed: ${error.message}`);
            throw error;
        }
    }

    async login(loginUserDto: LoginUserDto) {
        const user = await this.databaseService.user.findUnique({
            where: { email: loginUserDto.email },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordMatching = await bcrypt.compare(loginUserDto.password, user.password);
        if (!isPasswordMatching) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = this.jwtService.sign(payload);

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }

    async generateAndSendOtp(email: string) {
        const user = await this.databaseService.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new UnauthorizedException('User not found.');
        }

        if(user.isVerified) {
            throw new ConflictException('User is already verified.');
        }

        // Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Save the OTP to the user's record using the DatabaseService
        await this.databaseService.user.update({
            where: { id: user.id },
            data: {
                otpCode,
                otpExpiresAt,
            },
        });

        // Send the OTP via email
        await this.sendOtpEmail(email, otpCode);

        return { message: 'OTP sent to your email.' };
    }

    private async sendOtpEmail(email: string, otp: string) {
        const transporter = createTransport({
            service: this.configService.get('EMAIL_SERVICE'),
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASS'),
            },
        });

        const mailOptions = {
            from: this.configService.get('EMAIL_USER'),
            to: email,
            subject: 'Your BizJetJobs Verification Code',
            html: `<h1>Your OTP is: ${otp}</h1><p>This code is valid for 10 minutes.</p>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`OTP email sent to: ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send OTP email: ${error}`);
            throw new Error('Failed to send OTP email. Please try again.');
        }
    }

    async verifyOtp(email: string, otpCode: string) {
        const user = await this.databaseService.user.findUnique({
            where: { email },
        });

        if (!user || user.otpCode !== otpCode || new Date() > (user.otpExpiresAt || new Date(0))) {
            throw new UnauthorizedException('Invalid or expired OTP.');
        }

        // Mark user as verified and clear OTP fields
        await this.databaseService.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otpCode: null,
                otpExpiresAt: null,
            },
        });

        return { message: 'Email verified successfully!' };
    }
}