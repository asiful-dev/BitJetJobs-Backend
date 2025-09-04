import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async register(createUserDto: CreateUserDto, profileImage: Express.Multer.File) {
    const { password, ...userData } = createUserDto;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload the profile image to Cloudinary
    const imageUrl = await this.cloudinaryService.uploadImage(profileImage);

    // In a real application, you would save this data to a database
    const newUser = {
      ...userData,
      password: hashedPassword,
      profileImageUrl: imageUrl,
      createdAt: new Date(),
    };

    // For now, we'll just log the user object
    console.log('New user registered:', newUser);

    return { message: 'User registered successfully!', user: newUser };
  }
}
