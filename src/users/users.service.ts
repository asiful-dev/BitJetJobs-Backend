import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, UserRole } from 'generated/prisma';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) { }
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
  async updateProfile(id: number, role: UserRole, profileData: any) {
    if (role === UserRole.JOB_SEEKER) {
      return this.databaseService.jobSeekerProfile.upsert({
        where: { userId: id },
        update: { ...profileData },
        create: {
          userId: id,
          ...profileData,
        },
      });
    } else if (role === UserRole.EMPLOYER) {
      return this.databaseService.employerProfile.upsert({
        where: { userId: id },
        update: { ...profileData },
        create: {
          userId: id,
          ...profileData,
        },
      });
    }

    throw new BadRequestException('Invalid user role.');
  }
}
