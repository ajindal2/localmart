import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { CacheService } from 'src/cache/cache.service';
//import { UserProfileService } from 'src/userProfile/userProfile.service';
//import { UserProfileModule } from 'src/userProfile/userProfile.module'; // Import the UserProfileModule

@Module({
  //imports: [UserProfileModule], // Add UserProfileModule to imports
  controllers: [LocationController],
  providers: [LocationService, CacheService]
})
export class LocationModule {}
