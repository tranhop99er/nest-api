import {
  Controller,
  Post,
  Get,
  BadGatewayException,
  Param,
} from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // Endpoint để đồng bộ tất cả tài khoản từ PostgreSQL sang MongoDB
  @Post('sync')
  async syncAccounts() {
    const accounts = await this.accountService.getAllAccounts();
    await this.accountService.syncAccounts(accounts);
    return {
      message: 'Accounts synchronized from PostgreSQL to MongoDB successfully.',
    };
  }

  // Lấy một tài khoản từ MongoDB theo accountId
  @Get(':id')
  async getAccountById(@Param('id') id: string) {
    const user = await this.accountService.getAccountById(id);
    if (!user) {
      throw new BadGatewayException('User not found');
    }
    return user;
  }
}
