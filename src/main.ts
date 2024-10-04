import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyGlobalFilter } from './common/utils';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ExecutionTimeInterceptor } from './common/guards/interceptors/execution-time.intercepter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // true for all origins
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(cookieParser());

  app.setGlobalPrefix('/api/v1');

  // global filter
  applyGlobalFilter(app);

  // global exception filter
  app.useGlobalInterceptors(new ExecutionTimeInterceptor());

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
