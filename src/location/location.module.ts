import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { CacheService } from 'src/cache/cache.service';


@Module({
  controllers: [LocationController],
  providers: [LocationService, CacheService]
})
export class LocationModule {}
