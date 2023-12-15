import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { SellerController } from './seller.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerSchema } from './schemas/seller.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Seller', schema: SellerSchema },
    ])
  ],
  providers: [SellerService],
  controllers: [SellerController],
  exports: [SellerService]
})
export class SellerModule {}
