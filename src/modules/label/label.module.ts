import { Module } from '@nestjs/common';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [LabelController],
  providers: [LabelService, PrismaService, ConfigService],
})
export class LabelModule {}
