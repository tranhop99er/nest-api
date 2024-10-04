import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch(HttpException)
export class HTTPExceptionFilter implements ExceptionFilter<HttpException> {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(e: HttpException, host: ArgumentsHost): void {
    console.log('HTTP Filter 📕📕📕', e);

    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const timestamp = new Date().toISOString();
    const statusCode = e.getStatus();

    httpAdapter.reply(
      ctx.getResponse(),
      { message: e.message, statusCode, timestamp, path },
      statusCode,
    );
  }
}
