import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Listing } from './schemas/listing.schema';
import { CreateListingDTO } from './dtos/create-listing.dto';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { Seller } from 'src/seller/schemas/seller.schema';

@Injectable()
export class ListingService {
  constructor(
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>
    ) { }

  async getFilteredListings(queryListingDTO: QueryListingDTO ): Promise<Listing[]> {
    const { title } = queryListingDTO;
    let listings = await this.getAllListings();

    if (title) {
      listings = listings.filter(listing => 
        listing.title.toLowerCase().includes(title.toLowerCase()) ||
        listing.description.toLowerCase().includes(title.toLowerCase())
      );
    }

    /*if (category) {
      listings = listings.filter(listing => listing.category === category)
    }*/

    return listings;
  }

  async getAllListings(): Promise<Listing[]> {
    const listings = await this.listingModel.find().exec();
    return listings;
  }

  async getListing(id: string): Promise<Listing> {
    const listing = await this.listingModel.findById(id).exec();
    return listing;
  }

  async addListing(createListingDTO: CreateListingDTO): Promise<Listing> {
    const newListing = await this.listingModel.create(createListingDTO);
    return newListing.save();
  }

  async updateListing(id: string, createListingDTO: CreateListingDTO): Promise<Listing> {
    const updatedListing = await this.listingModel
      .findByIdAndUpdate(id, createListingDTO, { new: true });
    return updatedListing;
  }

  async deleteListing(id: string): Promise<any> {
    const deletedListing = await this.listingModel.findByIdAndRemove(id);
    return deletedListing;
  }

  async createListing(userId: string, createListingDto: CreateListingDTO): Promise<Listing> {
    // Check if seller exists, if not, create one
    let seller = await this.sellerModel.findOne({ user: userId });
    if (!seller) {
      seller = new this.sellerModel({ user: userId });
      await seller.save();
    }

    // Create a new listing
    const newListing = new this.listingModel({
      ...createListingDto,
      seller: seller._id
    });

    return await newListing.save();
  }
}