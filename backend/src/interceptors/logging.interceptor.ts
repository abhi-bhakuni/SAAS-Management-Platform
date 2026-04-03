import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      {
        ip,
        userAgent: userAgent.substring(0, 100), // Truncate long user agents
        timestamp: new Date().toISOString(),
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.log(
            `Response: ${method} ${url} ${statusCode} - ${duration}ms`,
            {
              duration,
              statusCode,
              timestamp: new Date().toISOString(),
            },
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // Log error response
          this.logger.error(
            `Error Response: ${method} ${url} ${error.status || 500} - ${duration}ms`,
            {
              duration,
              statusCode: error.status || 500,
              error: error.message,
              timestamp: new Date().toISOString(),
            },
          );
        },
      }),
    );
  }
}