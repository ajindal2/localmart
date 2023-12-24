import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingSchema } from './schemas/rating.schema';
import { SellerSchema } from 'src/seller/schemas/seller.schema';
import { UserProfileSchema } from 'src/userProfile/schemas/userProfile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Rating', schema: RatingSchema },
      { name: 'Seller', schema: SellerSchema },
      { name: 'UserProfile', schema: UserProfileSchema },
    ])
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
