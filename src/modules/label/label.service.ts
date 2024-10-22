import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { CreateLabelDto } from './dto';
import { Label } from '@prisma/client';
import { WithCurrentUser } from 'src/common/types';
import { API_ERROR_MSG } from 'src/packages/messages';
import { ILabelId, LabelUpdate } from './interfaces';

@Injectable()
export class LabelService {
  constructor(private readonly prismaService: PrismaService) {}

  async createLabel(args: WithCurrentUser<CreateLabelDto>): Promise<Label> {
    const { currentUser, name } = args;

    // Check if the user is active
    const accountCurrent = await this.prismaService.account.findUnique({
      where: {
        id: currentUser.id,
      },
    });

    if (accountCurrent.status === 'INACTIVE') {
      throw new BadRequestException(API_ERROR_MSG.disabledAccount);
    }

    return await this.prismaService.label.create({
      data: {
        name,
        createdBy: {
          connect: {
            id: currentUser.id,
          },
        },
      },
    });
  }

  async updateLabel(args: WithCurrentUser<LabelUpdate>): Promise<Label> {
    const { currentUser, id, name } = args;

    // Check if the user is active
    const accountCurrent = await this.prismaService.account.findUnique({
      where: {
        id: currentUser.id,
      },
    });

    if (accountCurrent.status === 'INACTIVE') {
      throw new BadRequestException(API_ERROR_MSG.disabledAccount);
    }

    return await this.prismaService.label.update({
      where: { id },
      data: {
        name,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  async getLabel(args: WithCurrentUser<ILabelId>): Promise<Label> {
    const { currentUser, id } = args;

    // Check if the user is active
    const accountCurrent = await this.prismaService.account.findUnique({
      where: {
        id: currentUser.id,
      },
    });

    if (accountCurrent.status === 'INACTIVE') {
      throw new BadRequestException(API_ERROR_MSG.disabledAccount);
    }

    return await this.prismaService.label.findUnique({
      where: { id },
    });
  }

  async delLabel(args: WithCurrentUser<ILabelId>): Promise<Label> {
    const { currentUser, id } = args;

    // Check if the user is active
    const accountCurrent = await this.prismaService.account.findUnique({
      where: {
        id: currentUser.id,
      },
    });

    if (accountCurrent.status === 'INACTIVE') {
      throw new BadRequestException(API_ERROR_MSG.disabledAccount);
    }

    return await this.prismaService.label.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    });
  }
}
