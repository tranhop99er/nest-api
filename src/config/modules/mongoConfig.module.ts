import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoConfig } from '../environment/mongo.config';

export const MongoConfigModule = MongooseModule.forRootAsync({
  imports: [ConfigModule.forFeature(mongoConfig)],
  useFactory: (
    configService: ConfigService<{ mongo: ConfigType<typeof mongoConfig> }>,
  ) => ({
    uri: configService.get('mongo.uri', { infer: true }),
    dbName: configService.get('mongo.db', { infer: true }),
    enableUtf8Validation: false,
  }),
  inject: [ConfigService],
});
