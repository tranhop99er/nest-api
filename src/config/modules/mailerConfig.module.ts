import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { join } from 'path';
import { smtpConfig } from '../environment';

export const MailerConfigModule = MailerModule.forRootAsync({
  imports: [ConfigModule.forFeature(smtpConfig)],
  useFactory: async (
    configService: ConfigService<{
      smtp: ConfigType<typeof smtpConfig>;
    }>,
  ) => ({
    transport: {
      host: configService.get('smtp.smtpHost', { infer: true }),
      secure: true,
      auth: {
        user: configService.get('smtp.smtpUser', { infer: true }),
        pass: configService.get('smtp.smtpPassword', { infer: true }),
      },
      tls: {
        rejectUnauthorized: false,
      },
    },
    defaults: {
      from: `"No reply" <${configService.get('smtp.smtpMailFrom', { infer: true })}>`,
    },
    template: {
      dir: join('views', 'email-templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  }),
  inject: [ConfigService],
});
