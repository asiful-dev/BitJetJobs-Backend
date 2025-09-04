import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()

// database service to connect to the database
export class DatabaseService extends PrismaClient implements OnModuleInit {

    async onModuleInit() {
        await this.$connect()
    }

}
