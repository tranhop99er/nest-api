import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { GlobalFilter } from '../filter/exceptions';
import { HTTPExceptionFilter } from '../filter/http';
import { ZodValidationExceptionFilter } from '../filter/zod';

export const applyGlobalFilter = (app: INestApplication) => {
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalFilter(httpAdapterHost),
    new HTTPExceptionFilter(httpAdapterHost),
    new ZodValidationExceptionFilter(httpAdapterHost),
  );
};
