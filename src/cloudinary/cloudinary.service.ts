import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryConfigService } from './cloudinary-config.service';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: CloudinaryConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getCloudName(),
      api_key: this.configService.getApiKey(),
      api_secret: this.configService.getApiSecret(),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path);
      return result.secure_url;
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload image to Cloudinary.');
    }
  }
}