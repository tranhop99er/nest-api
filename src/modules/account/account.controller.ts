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

  @Post('sync-account')
  async syncAccounts() {
    await this.accountService.syncAccounts();
    return {
      message: 'Accounts synchronized from PostgreSQL to MongoDB successfully.',
    };
  }

  @Get(':id')
  async getAccountById(@Param('id') id: string) {
    const user = await this.accountService.getAccountById(id);
    if (!user) {
      throw new BadGatewayException('User not found');
    }
    return user;
  }
}
