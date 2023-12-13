import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ListingSchema } from './schemas/listing.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerSchema } from 'src/seller/schemas/seller.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Listing', schema: ListingSchema },
      { name: 'Seller', schema: SellerSchema },
    ])
  ],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}


