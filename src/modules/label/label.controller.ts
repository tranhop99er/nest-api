import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LabelService } from './label.service';
import { ActiveUser, Roles } from 'src/common/decorators';
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { CreateLabelDto } from './dto';
import { Role } from '@prisma/client';

@Roles(Role.ADMIN, Role.ADMIN_CS)
@Controller('system/label')
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Delete(':/id')
  @HttpCode(HttpStatus.OK)
  deleteJob(@ActiveUser() currentUser: UserPayload, @Param() id: string) {
    return this.labelService.delLabel({ currentUser, id });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  createJob(
    @ActiveUser() currentUser: UserPayload,
    @Body() createLabelDto: CreateLabelDto,
  ) {
    console.log('currentUser', currentUser);
    console.log('createLabelDto', createLabelDto);
    return this.labelService.createLabel({ currentUser, ...createLabelDto });
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  updateJob(
    @ActiveUser() currentUser: UserPayload,
    @Body() createLabelDto: CreateLabelDto,
    @Param() id: string,
  ) {
    return this.labelService.updateLabel({
      currentUser,
      id,
      ...createLabelDto,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  getJob(@ActiveUser() currentUser: UserPayload, @Param() id: string) {
    return this.labelService.getLabel({ currentUser, id });
  }
}
