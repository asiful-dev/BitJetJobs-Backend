import { Injectable } from '@nestjs/common';


@Injectable()
export class CloudinaryConfigService {
  constructor() {}

  getCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME as string;
  }

  getApiKey(): string {
    return process.env.CLOUDINARY_API_KEY as string;
  }

  getApiSecret(): string {
    return process.env.CLOUDINARY_API_SECRET as string;
  }
}
