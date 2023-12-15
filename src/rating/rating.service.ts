import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDTO } from './dtos/create-rating.dto';
import { Seller } from 'src/seller/schemas/seller.schema';

@Injectable()
export class RatingService {
    constructor(
        @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
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

  async findRatingsBySellerId(sellerId: string): Promise<{averageRating: number, ratings: Rating[]}> {
    console.log("inside Ratings Service. sellerId: ", sellerId);
    if (!sellerId) {
      throw new NotFoundException('Seller ID is required.');
    }
    // Fetch the userId from the sellerId
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new Error('Seller not found');
    }
    console.log("inside Ratings Service. userId: ", seller.user);

    // Fetch the ratings for the seller's userId
    const ratings = await this.ratingModel.find({ ratedUser: seller.user, role: 'seller' }).exec();

    console.log("inside Ratings Service. ratings: ", ratings);

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
  }

  async deleteRating(id: string, userId: string): Promise<Rating> {
   const rating = await this.ratingModel.findOneAndDelete({ _id: id, ratedBy: userId }).exec();
    if (!rating) {
      throw new NotFoundException('Rating not found or user not authorized to delete');
    }
    return rating;
  }
}
