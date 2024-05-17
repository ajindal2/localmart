import { Module } from '@nestjs/common';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { LoggingService } from './services/logging.service';


@Module({
    providers: [CorrelationIdMiddleware, LoggingService],
    exports: [CorrelationIdMiddleware, LoggingService],
  })
  export class CommonModule {}
