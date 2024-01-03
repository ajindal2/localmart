import { Injectable } from '@nestjs/common';
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

    // Check if the listing is already saved by this user
    const existingSavedListing = await this.savedListingModel.findOne({ user: createSavedListingDto.user, listing: createSavedListingDto.listing });

    if (existingSavedListing) {
      // If it already exists, return the existing document
      return existingSavedListing;
    } else {
      // If not, create a new saved listing
      const newSavedListing = new this.savedListingModel(createSavedListingDto);
      return newSavedListing.save();
    }
  }

  async findAllByUser(userId: string): Promise<SavedListing[]> {
    const savedListings = await this.savedListingModel.find({ user: userId })
                                                      .populate('listing')
                                                      .exec();
    return savedListings;
  }

  async remove(id: string): Promise<SavedListing> {
    return this.savedListingModel.findByIdAndRemove(id).exec();
  }

  async checkSavedStatus(userId: string, listingId: string): Promise<{isSaved: boolean, savedListingId?: string}> {
    const savedListing = await this.savedListingModel.findOne({ user: userId, listing: listingId }).exec();

    if (savedListing) {
      return { isSaved: true, savedListingId: savedListing._id.toString() }; // Convert ObjectId to string
    } else {
      return { isSaved: false };
    }
  }
}
