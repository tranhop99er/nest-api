import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { LabelModule } from '../label/label.module';
import { AuthController } from '../auth/auth.controller';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    AuthModule,
    RouterModule.register([
      {
        path: 'system',
        module: SystemModule,
        children: [
          {
            path: 'label',
            module: LabelModule,
          },
          {
            path: 'account',
            module: AccountModule,
          },
        ],
      },
    ]),
    LabelModule,
  ],
  controllers: [AuthController],
})
export class SystemModule {}
