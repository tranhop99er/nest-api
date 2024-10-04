// src/config/environment.ts
import { registerAs } from '@nestjs/config';

export const smtpConfig = registerAs('smtp', () => ({
  smtpUser: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  smtpMailFrom: process.env.SMTP_MAIL_FROM ?? 'no-reply@mail.work',
  twoFaTTl: parseInt(process.env.TWO_FA_TTL ?? '900', 10),
}));

export type TwofaConfig = ReturnType<typeof smtpConfig>;
