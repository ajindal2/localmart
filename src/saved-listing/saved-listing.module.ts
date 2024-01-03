import { Module } from '@nestjs/common';
import { SavedListingController } from './saved-listing.controller';
import { SavedListingService } from './saved-listing.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedListingSchema } from './schemas/saved-listing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SavedListing', schema: SavedListingSchema },
    ])
  ],
  controllers: [SavedListingController],
  providers: [SavedListingService],
  exports: [SavedListingService]
})
export class SavedListingModule {}
