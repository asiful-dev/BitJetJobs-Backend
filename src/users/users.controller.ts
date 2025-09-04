import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImage'))
  async register(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    if (!profileImage) {
      throw new HttpException('Profile image is required.', HttpStatus.BAD_REQUEST);
    }
    return this.userService.register(createUserDto, profileImage);
  }
}
