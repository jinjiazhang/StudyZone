import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Normalizes all errors to { code, message, details? } JSON.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body =
        typeof raw === 'string'
          ? { code: 'http_error', message: raw }
          : {
              code: (raw as any).code ?? this.codeFromStatus(status),
              message: (raw as any).message ?? exception.message,
              details: (raw as any).details,
            };
      return res.status(status).json(body);
    }

    this.logger.error('Unhandled exception', exception as any);
    return res.status(500).json({
      code: 'internal_error',
      message: 'Something went wrong on our side.',
    });
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'bad_request';
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 409:
        return 'conflict';
      case 422:
        return 'unprocessable';
      default:
        return 'http_error';
    }
  }
}
