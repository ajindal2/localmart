import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
      @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>) { }

  private logger: Logger = new Logger('RatingService');

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
      this.logger.error(`Error creating${createRatingDTO.role} rating for listing ${createRatingDTO.listingId}, ratedBy ${createRatingDTO.ratedBy}, ratedUser ${createRatingDTO.ratedUser}`, error);
      if (error.code === 11000) {
        // Handle duplicate key error (e.g., if you have unique constraints in your schema)
        throw new ConflictException('Duplicate entry for rating.');
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('Validation failed for rating.');
      } else if (error.name === 'ConflictException') {
        throw error;
      } else {
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
      this.logger.error(`Error checking rating exists for listing ${listingId}, ratedBy ${ratedBy}, ratedUser ${ratedUser}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Validation failed for rating existence check');
      } else {
        throw new InternalServerErrorException('Failed to check rating exists.');
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
      const ratings = await this.ratingModel.find({
        ratedUser: userId,
        role: 'seller' // Only fetch ratings where the user is rated as a seller
      })
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
  
      // Extract user IDs for profile lookup, checking for null ratedBy
      const userIds = ratings
        .map(rating => rating.ratedBy ? rating.ratedBy._id : null)
        .filter(id => id !== null);
  
      // Step 4: Fetch UserProfiles based on userIds and map ratings
      const userProfiles = await this.userProfileModel.find({ userId: { $in: userIds } });
  
      const ratingsWithProfile = ratings.map(rating => {
        const userProfile = rating.ratedBy ? userProfiles.find(profile => profile.userId.equals(rating.ratedBy._id)) : null;
        return {
          ...rating.toObject(), // Convert the Mongoose document to a plain object
          ratedBy: rating.ratedBy || null,
          ratedByProfilePicture: userProfile ? userProfile.profilePicture : null, // Return null if userProfile or ratedBy is null
        };
      });
  
      return { averageRating, ratingsWithProfile };
    } catch (error) {
      this.logger.error(`Error fetching ratings for userId ${userId}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Database validation failed in fetching ratings with profiles.');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred in fetching ratings for the user');
      }
    }
  }

  async findRatingsWithProfilesBySellerId(sellerId: string) {
    try {
      if (!sellerId) {
        throw new NotFoundException('Seller ID is required.');
      }
      // Fetch the userId from the sellerId
      const seller = await this.sellerModel.findById(sellerId).exec();
      if (!seller) {
        throw new NotFoundException(`SellerId ${sellerId} not found `);
      }
  
      // Step 1: Retrieve 'Seller' ratings and populate 'ratedBy' field
      const ratings = await this.ratingModel.find({
        ratedUser: seller.userId,
        role: 'seller' // Only fetch ratings where the user is rated as a seller
      })
      .populate('ratedBy', 'displayName')
      .populate('ratedUser', 'displayName')
      .exec();
  
      // Step 2: Fetch or Create the UserProfile of the seller
      const sellerProfile = await this.userProfileModel.findOneAndUpdate(
        { userId: seller.userId }, // Query to find the document
        { $setOnInsert: { userId: seller.userId } }, // Set initial fields if creating new
        {
          new: true, // Return the modified document instead of the original
          upsert: true, // Create the document if it doesn't exist
          populate: { path: 'userId', select: 'displayName date' } // Population options
        }
      ).exec();
  
      if (!ratings || ratings.length === 0) {
        // Handle the case where no ratings are found
        return { averageRating: 0, ratingsWithProfile: [], sellerProfile, tagsSummary: {} };
      }
  
      // Step 3: Compute Average Rating
      const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
      const averageRating = sum / ratings.length;
  
      // Step 4: Aggregate tags from all ratings
      const tagsSummary = ratings.reduce((acc, rating) => {
        rating.tags.forEach(tag => {
          if (acc[tag]) {
            acc[tag] += 1; // Increment count if tag already exists
          } else {
            acc[tag] = 1; // Initialize count if tag is new
          }
        });
        return acc;
      }, {});
  
      // Extract user IDs for profile lookup, handling possible null `ratedBy`
      const userIds = ratings
        .map(rating => rating.ratedBy ? rating.ratedBy._id : null)
        .filter(id => id !== null);
  
      // Step 5: Fetch UserProfiles based on userIds and map ratings
      const userProfiles = await this.userProfileModel.find({ userId: { $in: userIds } });
  
      const ratingsWithProfile = ratings.map(rating => {
        const userProfile = rating.ratedBy ? userProfiles.find(profile => profile.userId.equals(rating.ratedBy._id)) : null;
        return {
          ...rating.toObject(), // Convert the Mongoose document to a plain object
          ratedBy: rating.ratedBy || null,
          ratedByProfilePicture: userProfile ? userProfile.profilePicture : null, // Return null if userProfile or ratedBy is null
        };
      });
  
      return { averageRating, ratingsWithProfile, sellerProfile, tagsSummary };
    } catch (error) {
      this.logger.error(`Error fetching ratings with profiles for sellerId ${sellerId}`, error)
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
