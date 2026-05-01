import {Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('Http');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const { method, url } = request;
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const statusCode = response.statusCode;
                    const duration = Date.now() - start;
                    this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`);
                },
                error: () => {
                    const statusCode = response.statusCode;
                    const duration = Date.now() - start;
                    this.logger.error(`${method} ${url} ${statusCode} - ${duration}ms`);
                },
            }),
        )
    }
}