import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from '@prisma/client';
import { Model } from 'mongoose';
import { User, UserRole } from 'schema/user.schema';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async findAll(): Promise<Account[]> {
    return await this.prismaService.account.findMany();
  }

  async syncAccounts(): Promise<void> {
    const accounts: Account[] = await this.findAll();
    try {
      for (const account of accounts) {
        await this.userModel.updateOne(
          { accountId: account.id },
          {
            $set: {
              name: account.username,
              email: account.email,
              role: account.role as UserRole,
            },
          },
          { upsert: true },
        );
      }
    } catch (error) {
      console.error('Error syncing accounts:', error);
    }
  }

  async getAccountById(id: string): Promise<Account | null> {
    return await this.prismaService.account.findUnique({
      where: { id: id },
    });
  }

  @Cron('* * * * *')
  async handleCron() {
    await this.syncAccounts();
  }
}
