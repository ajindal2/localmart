import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ListingModule } from './listing/listing.module';
import { SellerModule } from './seller/seller.module';
import { UserProfileModule } from './userProfile/userProfile.module';
import { RatingModule } from './rating/rating.module';
import { SavedListingModule } from './saved-listing/saved-listing.module';
import { SharedModule } from './shared/shared.module';

// TODO add authentication. Ask "Can you give step by steps details on how to setup and start my mongodb server?"
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/test', {
      connectionFactory: (connection) => {
        console.log('Connected to MongoDB');
        return connection;
      },
    }),
    ProductModule,
    UserModule,
    AuthModule,
    ListingModule,
    SellerModule,
    UserProfileModule,
    RatingModule,
    SavedListingModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
