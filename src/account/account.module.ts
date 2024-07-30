import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSchema } from 'src/chat/schemas/chat.schema';
import { UserSchema } from 'src/user/schemas/user.schema';
import { NotificationsCounterSchema } from 'src/chat/schemas/notifications-counter.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';
import { Listing } from 'src/listing/schemas/listing.schema';
import { SavedListing } from 'src/saved-listing/schemas/saved-listing.schema';
import { UserPreferences } from 'src/user-preferences/schemas/user-preferences.schema';
import { Rating } from 'src/rating/schemas/rating.schema';
import { Seller } from 'src/seller/schemas/seller.schema';
import { RefreshToken } from 'src/auth/schemas/refresh-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Chat', schema: ChatSchema },
      { name: 'User', schema: UserSchema },
      { name: 'NotificationsCounter', schema: NotificationsCounterSchema }, 
      { name: 'UserProfile', schema: UserProfile },
      { name: 'Listing', schema: Listing },
      { name: 'SavedListing', schema: SavedListing },
      { name: 'UserPreferences', schema: UserPreferences },
      { name: 'Rating', schema: Rating },
      { name: 'Seller', schema: Seller },
      { name: 'RefreshToken', schema: RefreshToken },
    ])
  ],
  controllers: [AccountController],
  providers: [AccountService]
})
export class AccountModule {}

