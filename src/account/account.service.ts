import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { RefreshToken } from 'src/auth/schemas/refresh-token.schema';
import { Chat } from 'src/chat/schemas/chat.schema';
import { NotificationsCounter } from 'src/chat/schemas/notifications-counter.schema';
import { Listing } from 'src/listing/schemas/listing.schema';
import { Rating } from 'src/rating/schemas/rating.schema';
import { SavedListing } from 'src/saved-listing/schemas/saved-listing.schema';
import { Seller } from 'src/seller/schemas/seller.schema';
import { UserPreferences } from 'src/user-preferences/schemas/user-preferences.schema';
import { User } from 'src/user/schemas/user.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';

@Injectable()
export class AccountService {
    constructor(
        @InjectModel(Chat.name) private chatModel: Model<Chat>, 
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
        @InjectModel(NotificationsCounter.name) private notificationsCounterModel: Model<NotificationsCounter>,
        @InjectModel(Listing.name) private listingModel: Model<Listing>,
        @InjectModel(SavedListing.name) private savedListingModel: Model<SavedListing>,
        @InjectModel(UserPreferences.name) private userPreferencesModel: Model<UserPreferences>,
        @InjectModel(UserProfile.name) private ratingModel: Model<Rating>,
        @InjectModel(Seller.name) private sellerModel: Model<Seller>,
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshToken>,
        @InjectConnection() private readonly connection: Connection,
        ) {}
    
      private logger: Logger = new Logger('AccountService');

      async deleteAccount(userId: string): Promise<void> {
        const session = await this.connection.startSession();
        session.startTransaction();
      
        try {
          const objectId = new Types.ObjectId(userId);
      
          // Delete listings associated with the seller
          const seller = await this.sellerModel.findOne({ userId: objectId }).session(session).exec();
          if (seller) {
            await this.listingModel.deleteMany({ sellerId: seller._id }).session(session).exec();
          }
      
          // Delete saved listings
          await this.savedListingModel.deleteMany({ userId: objectId }).session(session).exec();
      
          // Delete user profile
          await this.userProfileModel.deleteOne({ userId: objectId }).session(session).exec();
      
          // Delete user preferences
          await this.userPreferencesModel.deleteOne({ userId: objectId }).session(session).exec();
      
          // Delete refresh tokens
          await this.refreshTokenModel.deleteMany({ userId: objectId }).session(session).exec();
      
          // Delete notifications counters
          await this.notificationsCounterModel.deleteMany({ userId: objectId }).session(session).exec();
      
          // Delete seller profile
          if (seller) {
            await this.sellerModel.deleteOne({ _id: seller._id }).session(session).exec();
          }
      
          // Delete user
          await this.userModel.deleteOne({ _id: objectId }).session(session).exec();
      
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          this.logger.error(`Error deleting account for user ${userId}`, error);
          throw new InternalServerErrorException('Could not delete account. Please try again later.');
        } finally {
          session.endSession();
        }
      }
}
