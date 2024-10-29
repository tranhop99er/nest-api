import { Module } from '@nestjs/common';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LabelController],
  providers: [LabelService, PrismaService, ConfigService],
})
export class LabelModule {}
