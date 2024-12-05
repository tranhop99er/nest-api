import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from '@prisma/client';
import { Model } from 'mongoose';
import { User } from 'schema/user.schema';
import { PrismaService } from 'src/common/modules/prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getAllAccounts(): Promise<Account[]> {
    return await this.prismaService.account.findMany();
  }

  async syncAccounts(accounts: Account[]): Promise<void> {
    console.log('Syncing accounts from PostgreSQL to MongoDB...');
    try {
      for (const account of accounts) {
        const existingUser = await this.userModel.findOne({
          accountId: account.id,
        });

        if (!existingUser) {
          const newUser = new this.userModel({
            name: account.username,
            accountId: account.id,
            role: account.role,
          });

          await newUser.save();
        }
      }
      console.log('Sync completed');
    } catch (error) {
      console.error('Error syncing accounts:', error);
    }
  }

  async getAccountById(id: string): Promise<Account | null> {
    return await this.prismaService.account.findUnique({
      where: { id: id },
    });
  }
}
