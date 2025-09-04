// src/auth/jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service'; // Use the DatabaseService directly

// Define a type for the JWT payload for strong typing
export type JwtPayload = { sub: number; email: string; role: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy,'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService, // Inject DatabaseService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string
    });
  }

  // The validate method is called after the JWT is decoded and verified
  async validate(payload: JwtPayload) {
    const user = await this.databaseService.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Return the user object, which will be attached to the request (req.user)
    return user;
  }
}