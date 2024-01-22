import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerSchema } from './schemas/seller.schema';
import { UserProfileSchema } from 'src/userProfile/schemas/userProfile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Seller', schema: SellerSchema },
      { name: 'UserProfile', schema: UserProfileSchema },
    ])
  ],
  providers: [SellerService],
  controllers: [SellerController],
  exports: [SellerService]
})
export class SellerModule {}
