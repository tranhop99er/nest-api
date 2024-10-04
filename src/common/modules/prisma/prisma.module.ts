import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({})
export class PrismaModule {
  providers: [PrismaService];
  exports: [PrismaService];
}
