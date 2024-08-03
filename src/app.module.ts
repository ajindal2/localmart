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
import { LocationModule } from './location/location.module';
import { CacheModule } from './cache/cache.module';
import { ChatModule } from './chat/chat.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { CommonModule } from './common/common.module';
import { AccountModule } from './account/account.module';
import { BlockUserModule } from './block-user/block-user.module';


@Module({
  imports: [
   /*MongooseModule.forRoot('mongodb://127.0.0.1:27017/test', {
      connectionFactory: (connection) => {
        console.log('Connected to MongoDB');
        return connection;
      },
    }),*/
     MongooseModule.forRoot(process.env.DB_URI, {
      //useNewUrlParser: true,
      // useUnifiedTopology: true,
      connectionFactory: (connection) => {
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
    LocationModule,
    CacheModule,
    ChatModule,
    UserPreferencesModule,
    ImageUploadModule,
    CommonModule,
    AccountModule,
    BlockUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
