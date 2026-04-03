import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly timeoutMs = parseInt(process.env.REQUEST_TIMEOUT || '30000'); // 30 seconds default

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          const request = context.switchToHttp().getRequest();
          this.logger.error(
            `Request timeout after ${this.timeoutMs}ms: ${request.method} ${request.url}`,
            {
              method: request.method,
              url: request.url,
              timeout: this.timeoutMs,
              timestamp: new Date().toISOString(),
            },
          );
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => error);
      }),
    );
  }
}