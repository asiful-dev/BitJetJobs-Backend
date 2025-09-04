import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '../../generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly cloudinaryService: CloudinaryService, private readonly databaseService: DatabaseService) { }

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

  async create(createUserDto: Prisma.UserCreateInput) {
    return this.databaseService.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.databaseService.user.findMany();
  }

  async findOne(id: number) {
    return this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.databaseService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    return this.databaseService.user.delete({
      where: { id },
    });
  }


}
