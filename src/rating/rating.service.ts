import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDTO } from './dtos/create-rating.dto';
import { Seller } from 'src/seller/schemas/seller.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';
import { SavedListing } from 'src/saved-listing/schemas/saved-listing.schema';

@Injectable()
export class RatingService {
  constructor(
      @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
      @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
      @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>,
      ) { }

  async createRating(createRatingDTO: CreateRatingDTO): Promise<Rating> {
    try {
      const ratingExists = await this.checkRatingExists(createRatingDTO.listingId, createRatingDTO.ratedBy, createRatingDTO.ratedUser);
      if (ratingExists) {
        throw new ConflictException(`Rating has already been given`);
      }
      const newRating = new this.ratingModel({
        ...createRatingDTO,
        dateGiven: new Date(),
      });
      const savedRating = await newRating.save();
      return savedRating;

    } catch (error) {
      if (error.code === 11000) {
        // Handle duplicate key error (e.g., if you have unique constraints in your schema)
        throw new ConflictException('Duplicate entry for rating.');
      } else if (error.name === 'ValidationError') {
        // Handle Mongoose validation errors
        throw new BadRequestException('Validation failed for rating.');
      } else if (error.name === 'ConflictException') {
        throw error;
      } else {
        console.error('Error creating rating:', error);
        throw new InternalServerErrorException('Failed to create rating.');
      }
    }
  }

  // Return true if it exists
  async checkRatingExists(listingId: string, ratedBy: string, ratedUser: string): Promise<boolean> {
    if (!listingId || !ratedBy || !ratedUser) {
      throw new BadRequestException('Missing required parameters');
    }

    try {
      const rating = await this.ratingModel.findOne({
        listingId,
        ratedUser: ratedUser,
        ratedBy: ratedBy,
      }).exec();
      return !!rating; // Convert the result to a boolean
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Validation failed for rating.');
      } else {
        console.error('Error creating rating:', error);
        throw new InternalServerErrorException('Failed to check rating.');
      }
    }
  }

  async findAllRatings(): Promise<Rating[]> {
    return await this.ratingModel.find().exec();
  }

  async findRatingById(id: string): Promise<Rating> {
    const rating = await this.ratingModel.findById(id).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }
    return rating;
  }

  async getRatingsByUser(userId: string) {
    try {
      // Step 1: Retrieve ratings and populate 'ratedBy' field
      const ratings = await this.ratingModel.find({ ratedUser: userId })
      .populate('ratedBy', 'displayName')
      .populate('ratedUser', 'displayName')
      .exec();

      if (!ratings || ratings.length === 0) {
        // Handle the case where no ratings are found
        return { averageRating: 0, ratingsWithProfile: [] };
      }

      // Step 3: Compute Average Rating
      const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
      const averageRating = sum / ratings.length;
    
      // Extract user IDs for profile lookup
      const userIds = ratings.map(rating => rating.ratedBy._id);
    
      // Step 4: Fetch UserProfiles based on userIds and map ratings
      const userProfiles = await this.userProfileModel.find({ userId: { $in: userIds } });
    
      const ratingsWithProfile = ratings.map(rating => {
        const userProfile = userProfiles.find(profile => profile.userId.equals(rating.ratedBy._id));
        return {
          ...rating.toObject(), // Convert the Mongoose document to a plain object
          ratedByProfilePicture: userProfile?.profilePicture,
        };
      });

      return { averageRating, ratingsWithProfile };
    } catch (error) {
        console.error('Error fetching ratings for userId:', userId);
        if (error.name === 'ValidationError') {
          throw new BadRequestException('Database validation failed in fetching ratings with profiles.');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred in fetching ratings for the user');
        }
    }
  }

  // TODO think if the return type of this should be defined by an interface.
  async findRatingsWithProfilesBySellerId(sellerId: string) {
    try {
      if (!sellerId) {
        throw new NotFoundException('Seller ID is required.');
      }
      // Fetch the userId from the sellerId
      const seller = await this.sellerModel.findById(sellerId).exec();
      if (!seller) {
        throw new NotFoundException('SellerId not found: ', sellerId);
      }

      // Step 1: Retrieve 'Seller' ratings and populate 'ratedBy' field
      const ratings = await this.ratingModel.find({ 
        ratedUser: seller.userId,
        role: 'seller' // Only fetch ratings where the user is rated as a seller
      })
      .populate('ratedBy', 'displayName')
      .populate('ratedUser', 'displayName')
      .exec();
    
      // Step 2: Fetch the UserProfile of the seller
      const sellerProfile = await this.userProfileModel.findOne({ userId: seller.userId })
      .populate({
        path: 'userId',
        select: 'displayName date', // Only fetch the userName field
      })
      .exec();
      

      if (!sellerProfile) {
        throw new NotFoundException('Seller profile not found for sellerId', sellerId);
      }

      if (!ratings || ratings.length === 0) {
        // Handle the case where no ratings are found
        return { averageRating: 0, ratingsWithProfile: [], sellerProfile };
      }
    
      // Step 3: Compute Average Rating
      const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
      const averageRating = sum / ratings.length;
    
      // Extract user IDs for profile lookup
      const userIds = ratings.map(rating => rating.ratedBy._id);
    
      // Step 4: Fetch UserProfiles based on userIds and map ratings
      const userProfiles = await this.userProfileModel.find({ userId: { $in: userIds } });
    
      const ratingsWithProfile = ratings.map(rating => {
        const userProfile = userProfiles.find(profile => profile.userId.equals(rating.ratedBy._id));
        return {
          ...rating.toObject(), // Convert the Mongoose document to a plain object
          ratedByProfilePicture: userProfile?.profilePicture,
        };
      });

      return { averageRating, ratingsWithProfile, sellerProfile };
    } catch (error) {
      console.error('Error fetching ratings with profiles:', error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('Database validation failed in fetching ratings with profiles.');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred in fetching ratings with profiles');
      }
    }
  }

  async deleteRating(id: string, userId: string): Promise<Rating> {
   const rating = await this.ratingModel.findOneAndDelete({ _id: id, ratedBy: userId }).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found or user not authorized to delete');
    }
    return rating;
  }
}
