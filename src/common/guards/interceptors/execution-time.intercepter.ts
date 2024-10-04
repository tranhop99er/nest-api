import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export class ExecutionTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        if (url.includes('healthcheck')) {
          return;
        }
        Logger.log(
          `${method} ${url} ${Date.now() - now}ms`,
          context.getClass().name,
        );
      }),
    );
  }
}
