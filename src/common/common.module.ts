import { Module } from '@nestjs/common';
import { LoggingService } from './services/logging.service';


@Module({
    providers: [LoggingService],
    exports: [LoggingService],
  })
  export class CommonModule {}
