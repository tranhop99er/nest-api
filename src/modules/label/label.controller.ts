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
  UseGuards,
} from '@nestjs/common';
import { LabelService } from './label.service';
import { ActiveUser, Roles } from 'src/common/decorators';
import { UserPayload } from 'src/common/strategies/jwt-payload.interface';
import { CreateLabelDto } from './dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/authentication/authentication.guard';
// import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthorizationGuard } from 'src/common/guards/authorization/authorization.guard';

@Controller()
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Roles(Role.ADMIN, Role.ADMIN_CS)
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Delete(':/id')
  @HttpCode(HttpStatus.OK)
  deleteLabel(@ActiveUser() currentUser: UserPayload, @Param() id: string) {
    return this.labelService.delLabel({ currentUser, id });
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  createLabel(
    @ActiveUser() currentUser: UserPayload,
    @Body() createLabelDto: CreateLabelDto,
  ) {
    return this.labelService.createLabel({ currentUser, ...createLabelDto });
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  updateLabel(
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
  getLabel(@ActiveUser() currentUser: UserPayload, @Param() id: string) {
    return this.labelService.getLabel({ currentUser, id });
  }
}
