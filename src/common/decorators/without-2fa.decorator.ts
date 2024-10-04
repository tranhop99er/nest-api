import { SetMetadata } from '@nestjs/common';

export const IS_WITHOUT_2FA = 'isWithout2fa';

export const Without2fa = () => SetMetadata(IS_WITHOUT_2FA, true);
