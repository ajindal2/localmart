import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Seller } from './schemas/seller.schema';
import { Model } from 'mongoose';
import { CreateSellerDTO } from './dtos/create-seller.dto';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';
import { LoggingService } from 'src/common/services/logging.service';

@Injectable()
export class SellerService {
    constructor(
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
        @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
        private readonly loggingService: LoggingService
        ) { 
          this.loggingService.setContext(SellerService.name);
        }

  async create(createSellerDto: CreateSellerDTO): Promise<Seller> {
    const newSeller = new this.sellerModel(createSellerDto);
    return await newSeller.save();
  }

  async findById(sellerId: string): Promise<Seller> {
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }
    return seller;
  }

  async getSellerDetails(sellerId: string): Promise<any> {
    try {
      // Fetch the Seller object and populate the 'userId' field to get the User document
      const seller = await this.sellerModel.findById(sellerId).populate('userId').exec();
  
      if (!seller) {
        throw new NotFoundException(`Seller with ID ${sellerId} not found`);
      }
  
      // TypeScript type assertion to treat 'userId' as a populated User document
      const user = seller.userId as any;
  
      // Now, 'user' has the properties of the User document
      const userId = user._id;
      const displayName = user.displayName;
  
      // Fetch the UserProfile object using userId from Seller object
      const userProfile = await this.userProfileModel.findOne({ userId: seller.userId }).exec();
  
      if (!userProfile) {
        throw new NotFoundException(`UserProfile for user ID ${user._id} not found`);
      }
  
      // Extract the profile picture from the UserProfile
      const profilePicture = userProfile.profilePicture;
  
      // return the user details of seller
      return {
        userId,
        displayName,
        profilePicture
      };
    } catch (error) {
      console.error(`Error fetching seller details for seller id: ${sellerId} ${error.message}`);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when fetching seller location');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when fetching seller details');
      }
    }
  }  
  
  async findByUserId(userId: string): Promise<Seller> {
    let seller = await this.sellerModel.findOne({ userId });
      if (!seller) {
        throw new NotFoundException(`Seller with ID ${userId} not found`);
    }
    return seller;
  }

  async deleteSeller(sellerId: string): Promise<{ deleted: boolean }> {
    try {
      const result = await this.sellerModel.deleteOne({ _id: sellerId }).exec();

      if (result.deletedCount === 0) {
        throw new Error('Seller not found');
      }

      return { deleted: true };
    } catch (error) {
      throw new Error('Error occurred while deleting the seller');
    }
  }

  async getSellerLocation(userId: string): Promise<any> {
    try {
      // Try to fetch seller's location
      let seller = await this.sellerModel.findOne({ userId });
      if (seller && seller.location) {
        // Return seller's location if it exists
        return seller.location;
      }

      // If seller does not exist or location is empty, fetch location from UserProfile
      const userProfile = await this.userProfileModel.findOne({ userId });
      const userProfileLocation =  userProfile ? userProfile.location : null;

      if (!seller) {
        // If seller is not yet cerated for this user, then create one and set the location from the Userprofile
        seller = new this.sellerModel({
          userId: userId,
          location: userProfileLocation,
        });
      } else if (!seller.location) {
        // If seller exists but location is empty, update from UserProfile
        seller.location = userProfileLocation;
        await seller.save();
      }
      return userProfileLocation;
    } catch (error) {
      console.error(`Error fetching seller location for userId: ${userId}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when fetching seller location');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when fetching seller location');
      }
    }
  }
}