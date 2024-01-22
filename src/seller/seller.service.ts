import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Seller } from './schemas/seller.schema';
import { Model } from 'mongoose';
import { CreateSellerDTO } from './dtos/create-seller.dto';
import { UserProfile } from 'src/userProfile/schemas/userProfile.schema';
import mongoose from 'mongoose';

@Injectable()
export class SellerService {
    constructor(
        @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
        @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
        ) { }

  async create(createSellerDto: CreateSellerDTO): Promise<Seller> {
    const newSeller = new this.sellerModel(createSellerDto);
    return newSeller.save();
  }

  async findById(sellerId: string): Promise<Seller> {
    const seller = await this.sellerModel.findById(sellerId).exec();
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }
    return seller;
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
  }
}