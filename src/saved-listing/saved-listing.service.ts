import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedListing } from './schemas/saved-listing.schema';
import { CreateSavedListingDTO } from './dtos/create-saved-listing.dto';

@Injectable()
export class SavedListingService {
  constructor(
    @InjectModel(SavedListing.name) private readonly savedListingModel: Model<SavedListing>
    ) { }

  async create(createSavedListingDto: CreateSavedListingDTO): Promise<SavedListing> {

    try {
      // Check if the listing is already saved by this user
      const existingSavedListing = await this.savedListingModel.findOne({ user: createSavedListingDto.user, listing: createSavedListingDto.listing });

      if (existingSavedListing) {
        // If it already exists, return the existing document
        return existingSavedListing;
      } else {
        // If not, create a new saved listing
        const newSavedListing = new this.savedListingModel(createSavedListingDto);
        return await newSavedListing.save();
      }
    } catch (error) {
      console.error('Error creating saved listing:', error);

      // Handle specific error types (e.g., MongoDB validation errors)
      if (error.name === 'ValidationError') {
        throw new InternalServerErrorException('Database validation failed while creating saved listing.');
      }

      // Throw a generic internal server error for unexpected cases
      throw new InternalServerErrorException('An unexpected error occurred while creating saved listing.');
    }
  }

  async findAllByUser(userId: string): Promise<SavedListing[]> {
    try {
    const savedListings = await this.savedListingModel.find({ user: userId })
                                                      .populate('listing')
                                                      .exec();
    
    if (!savedListings) {
      throw new NotFoundException(`No saved listings found for user "${userId}" `);
    }
    return savedListings;
    } catch (error) {
      console.error(`Error fetching saved listings for ${userId}:`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async remove(id: string): Promise<SavedListing> {
    try {
      return await this.savedListingModel.findByIdAndRemove(id).exec();
    } catch (error) {
      console.error('Error deleting saved listing:', error);
  
      // Handle specific error types (e.g., MongoDB validation errors)
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Database validation failed while deleting saved listing.');
      }
      throw new InternalServerErrorException('An unexpected error occurred while deleting saved listing.');
    }
  }

  async checkSavedStatus(userId: string, listingId: string): Promise<{isSaved: boolean, savedListingId?: string}> {
    try {
      const savedListing = await this.savedListingModel.findOne({ user: userId, listing: listingId }).exec();

      if (savedListing) {
        return { isSaved: true, savedListingId: savedListing._id.toString() }; // Convert ObjectId to string
      } else {
        return { isSaved: false };
      }
    } catch (error) {
      console.error(`Error fetching saved listing status for ${userId}:`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }
}
