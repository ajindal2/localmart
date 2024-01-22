import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDTO } from './dtos/create-rating.dto';
import { Seller } from 'src/seller/schemas/seller.schema';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';

@Injectable()
export class RatingService {
    constructor(
        @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
        @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>,
        ) { }

  async createRating(userId: string, createRatingDto: CreateRatingDTO): Promise<Rating> {
    const newRating = new this.ratingModel({
      ...createRatingDto,
      ratedBy: userId,
      dateGiven: new Date(),
    });
    return newRating.save();
  }

  async findAllRatings(): Promise<Rating[]> {
    return this.ratingModel.find().exec();
  }

  async findRatingById(id: string): Promise<Rating> {
    const rating = await this.ratingModel.findById(id).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }
    return rating;
  }

  // TODO think if the return type of this should be defined by an interface.
  async findRatingsWithProfilesBySellerId(sellerId: string) {

    if (!sellerId) {
      throw new NotFoundException('Seller ID is required.');
    }
    // Fetch the userId from the sellerId
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new Error('Seller not found');
    }

    // Step 1: Retrieve ratings and populate 'ratedBy' field
    const ratings = await this.ratingModel.find({ ratedUser: seller.userId })
                                          .populate('ratedBy', 'userName')
                                          .populate('ratedUser', 'userName')
                                          .exec();
  
    if (!ratings || ratings.length === 0) {
      // Handle the case where no ratings are found
      return { averageRating: 0, ratingsWithProfile: [], sellerProfile: null };
    }
  
    // Step 2: Compute Average Rating
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    const averageRating = sum / ratings.length;
  
    // Extract user IDs for profile lookup
    const userIds = ratings.map(rating => rating.ratedBy._id);
  
    // Step 3: Fetch UserProfiles based on userIds and map ratings
    const userProfiles = await this.userProfileModel.find({ userId: { $in: userIds } });
  
    const ratingsWithProfile = ratings.map(rating => {
      const userProfile = userProfiles.find(profile => profile.userId.equals(rating.ratedBy._id));
      console.log('profilePicture: ', userProfile.profilePicture);
      return {
        ...rating.toObject(), // Convert the Mongoose document to a plain object
        ratedByProfilePicture: userProfile?.profilePicture,
      };
    });
  
    // Step 4: Fetch the UserProfile of the seller
    const sellerProfile = await this.userProfileModel.findOne({ userId: seller.userId });

    return { averageRating, ratingsWithProfile, sellerProfile };
  }
  

  
  /*async findRatingsBySellerId(sellerId: string): Promise<{averageRating: number, ratings: Rating[]}> {
    if (!sellerId) {
      throw new NotFoundException('Seller ID is required.');
    }
    // Fetch the userId from the sellerId
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new Error('Seller not found');
    }

    const ratings = await this.ratingModel.find({ ratedUser: sellerId })
                                           .populate('ratedBy', 'userName')
                                           .exec();

    if (!ratings || ratings.length === 0) {
      throw new NotFoundException(`No ratings found for seller with ID ${sellerId}.`);
    }

    let sum = 0;
    ratings.forEach(rating => {
      sum += rating.stars;
    });

    const averageRating = ratings.length > 0 ? sum / ratings.length : 0;

    // Another way to calculate average
    // const averageRating = ratings.reduce((acc, rating) => acc + rating.stars, 0) / ratings.length;

    return {
      averageRating,
      ratings
    };  
  }*/

  async deleteRating(id: string, userId: string): Promise<Rating> {
   const rating = await this.ratingModel.findOneAndDelete({ _id: id, ratedBy: userId }).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found or user not authorized to delete');
    }
    return rating;
  }
}
