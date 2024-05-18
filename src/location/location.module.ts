import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { CacheService } from 'src/cache/cache.service';
import { CommonModule } from '../common/common.module'; 


@Module({
  imports: [CommonModule], 
  controllers: [LocationController],
  providers: [LocationService, CacheService]
})
export class LocationModule {}
