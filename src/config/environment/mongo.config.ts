import { registerAs } from '@nestjs/config';

export const mongoConfig = registerAs('mongo', () => {
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const port = process.env.MONGO_PORT ?? '27017';
  const db = process.env.MONGO_INITDB_DATABASE;
  const host = process.env.MONGO_HOST;
  const uri = `mongodb://${username}:${encodeURIComponent(password)}@${host}:${port}`;

  return {
    uri,
    db,
  };
});

export type MongoConfig = ReturnType<typeof mongoConfig>;
