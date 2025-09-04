import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus, Get, Param, Patch, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '../../generated/prisma';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImage'))
  async register(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    if (!profileImage) {
      throw new HttpException('Profile image is required.', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.register(createUserDto, profileImage);
  }
  
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  } 

}
