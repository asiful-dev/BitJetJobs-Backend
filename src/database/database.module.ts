import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService],
  exports:[DatabaseService] // if I didn't export it, other modules wouldn't be able to use it
})
export class DatabaseModule {}
