import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryConfigService } from './cloudinary-config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, CloudinaryConfigService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}