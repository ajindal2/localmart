import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Listing } from './schemas/listing.schema';
import { CreateListingDTO } from './dtos/create-listing.dto';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { Seller } from 'src/seller/schemas/seller.schema';
import { LocationDTO } from 'src/location/dtos/location.dto';
import axios from 'axios';
import { UpdateListingDTO } from './dtos/update-listing.dto';
import { CategoryDTO } from './dtos/category.dto';

@Injectable()
export class ListingService {
  constructor(
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>
    ) { }

    async getFilteredListings(query: QueryListingDTO, paginationOptions: { page: number; limit: number }): Promise<PaginatedListingsResult>  {
      const { title } = query;
      let locationParams = {
        latitude: query['location.latitude'],
        longitude: query['location.longitude'],
        maxDistance: query['location.maxDistance']
      };
  
      type AggregationStage = 
        | { $geoNear: { near: GeoJSONPoint; distanceField: string; maxDistance?: number; spherical: true; } }
        | { $match: Record<string, any> };
  
      let queryConditions = {
        // Use regex for case-insensitive match and exclude 'sold' listings
        state: { $not: { $regex: '^sold$', $options: 'i' } }
      };

      // Fuzzy text search for title
      if (title) {
        queryConditions['title'] = { $regex: title, $options: 'i' }; // Case-insensitive search
      }
  
      const pipeline: AggregationStage[] = [];
  
      // Geospatial query - only add if location is provided
      if (locationParams.latitude != null && locationParams.longitude != null) {
        const near: GeoJSONPoint = {
          type: "Point",
          coordinates: [parseFloat(locationParams.longitude), parseFloat(locationParams.latitude)]
        };
  
        pipeline.push({
          $geoNear: {
            near,
            distanceField: "distance",
            spherical: true,
            ...(locationParams.maxDistance && { maxDistance: parseFloat(locationParams.maxDistance) }),
          },
        });
      }
  
      // Always apply the match stage to filter by other conditions
      pipeline.push({
        $match: queryConditions
      });

      const skip = (paginationOptions.page - 1) * paginationOptions.limit;
  
      try {
        const listings = await this.listingModel.aggregate(pipeline)
        .skip(skip)
        .limit(paginationOptions.limit)
        .exec();  

        if (!listings) {
          throw new NotFoundException('No listings found matching the criteria');
        }

        const totalItems = await this.listingModel.countDocuments(queryConditions); // Count total documents matching the query
        const totalPages = Math.ceil(totalItems / paginationOptions.limit);

        return {
          listings,
          pagination: {
            totalItems,
            totalPages,
            currentPage: paginationOptions.page,
            itemsPerPage: paginationOptions.limit,
          },
        };
       } catch (error) {
        console.error('Error fetching listings:', error);
        if (error.name === 'NotFoundException') {
          throw error;
        } else if (error.name === 'ValidationError') {
          throw new BadRequestException('DB validation failed');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred');
        }
      }
    }

    async getAllListings(paginationOptions: { page: number; limit: number }): Promise<PaginatedListingsResult> {
      const { page, limit } = paginationOptions;
      const skip = (page - 1) * limit;
    
      try {
        // Add a condition to the find query to filter out 'sold' listings
        const listings = await this.listingModel.find({ state: { $not: { $regex: '^sold$', $options: 'i' } } }) 
        .skip(skip)
        .limit(limit)
        .exec();          
    
        const totalItems = await this.listingModel.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);
    
        if (!listings) {
          throw new NotFoundException('No listings found');
        }
    
        return {
          listings,
          pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
          },
        };
      } catch (error) {
        console.error('Error fetching listings:', error);
        if (error.name === 'NotFoundException') {
          throw error;
        } else if (error.name === 'ValidationError') {
          throw new BadRequestException('DB Validation failed');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred');
        }      
      }
    }

  async findListingsByUser(userId: string): Promise<Listing[]> {
    try {
    // Find the sellerId for the given userId
    const seller = await this.sellerModel.findOne({ userId }).exec();
    if (!seller) {
      throw new NotFoundException(`Seller with userId "${userId}" not found`);
    }
    const listings = await this.listingModel.find({ sellerId: seller._id }).exec();
    if (!listings) {
      throw new NotFoundException(`No listings found for seller "${seller._id}" `);
    }
    return listings;
  } catch (error) {
      console.error(`Error fetching listings for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async getListing(id: string): Promise<Listing> {
    try {
    const listing = await this.listingModel.findById(id);
    if (!listing) {
      console.log('ListingId not found: ', id);
      throw new NotFoundException('Listing not found');
    }
    return listing;
    } catch (error) {
      console.error(`Error getting listing from id ${id}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async updateListing(listingId: string, updateListingDto: UpdateListingDTO): Promise<Listing> {

    try {
      // Find the listing by ID
      const listing = await this.listingModel.findById(listingId);
      if (!listing) {
        console.log('ListingId not found: ', listingId);
        throw new NotFoundException('Listing not found');
      }
    
      // Parse the location data if it's a string
      let locationData;
      if (typeof updateListingDto.location === 'string') {
        try {
          locationData = JSON.parse(updateListingDto.location);
        } catch (error) {
          console.log('Invalid location data: ', updateListingDto.location);
          throw new BadRequestException('Invalid location data');
        }
      } else {
        locationData = updateListingDto.location;
      }

      // Use the parsed location data to update the seller's location if it's different
      const convertedLocation = this.convertLocationDtoToSchema(locationData);
      // We will not update seller location if they edit location while diting an already created listing.
      /*if (JSON.stringify(seller.location) !== JSON.stringify(convertedLocation)) {
        seller.location = convertedLocation;
        await seller.save();
      }*/
    
      // Update listing fields
      listing.title = updateListingDto.title;
      listing.description = updateListingDto.description;
      listing.price = updateListingDto.price;
      listing.imageUrls = updateListingDto.imageUrls; // Assuming new images are provided
      listing.location = convertedLocation; // Or handle location update logic

      let category = updateListingDto.category;
      if (category && typeof category === 'string') {
        try {
          category = JSON.parse(category);
          listing.category = {
            mainCategory: category.mainCategory,
            subCategories: category.subCategories || []
          }
        } catch (error) {
          throw new BadRequestException('Invalid JSON format for category.');
        }
      }
    
      // Save the updated listing
      return await listing.save();
    } catch (error) {
      console.error(`Error updating listing ${listingId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      }  else if (error.name === 'BadRequestException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async deleteListing(listingId: string): Promise<void> {
    try {
      const result = await this.listingModel.deleteOne({ _id: listingId }).exec();
      if (result.deletedCount === 0) {
        console.error(`Listing with ID "${listingId}" not found`);
        throw new NotFoundException(`Listing not found`);
      }
    } catch (error) {
      console.error(`Error deleting listing ${listingId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  // Update the status of a listing, can only be marked as sold and then cannot be undone.
  async updateListingStatus(listingId: string, newStatus: 'Sold'): Promise<Listing> {
    try {
      const listing = await this.listingModel.findById(listingId);
      if (!listing) {
        console.error(`Listing with ID "${listingId}" not found`);
        throw new NotFoundException(`Listing not found`);
      }
      listing.state = newStatus;
      return await listing.save();
    } catch (error) {
      console.error(`Error marking listing as sold ${listingId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

async createListing(userId: string, createListingDto: CreateListingDTO): Promise<Listing> {
  try {
    let seller = await this.sellerModel.findOne({ userId: userId });
    if (!seller) {
      seller = new this.sellerModel({ userId: userId });
      await seller.save();
    }

    // Parse the location data if it's a string
    let locationData;
    if (typeof createListingDto.location === 'string') {
      try {
        locationData = JSON.parse(createListingDto.location);
      } catch (error) {
        console.log('Invalid location data: ', createListingDto.location);
        throw new BadRequestException('Invalid location data');
      }
    } else {
      locationData = createListingDto.location;
    }

    // Use the parsed location data to update the seller's location if it's different
    const convertedLocation = this.convertLocationDtoToSchema(locationData);
    if (JSON.stringify(seller.location) !== JSON.stringify(convertedLocation)) {
      seller.location = convertedLocation;
      await seller.save();
    }

    let category = createListingDto.category;
    if (category && typeof category === 'string') {
      try {
        category = JSON.parse(category);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for category.');
      }
    }

    // Create a new listing
    const newListing = new this.listingModel({
      ...createListingDto,
      sellerId: seller._id,
      state: 'Available',
      location: convertedLocation,
      category: {
        mainCategory: category.mainCategory,
        subCategories: category.subCategories || []
      },
    });

    seller.location = convertedLocation;
    await seller.save();

    //Commenting since this should never get executed. We are always setting the locationData on clinet by calling location controller when only zipcode is enetred by user.
    /*
    // Additional logic for handling ZIP code only location
    if (locationData && locationData.postalCode && !locationData.coordinates) {
      // Only ZIP code provided, fetch coordinates and city from Google API
      const isValidZipcode = await this.isZipcodeValid(locationData.postalCode);
      if (!isValidZipcode) {
        console.log('Invalid ZIP code: ', locationData.postalCode);
        throw new Error('Invalid ZIP code');
      }

      // Fetch full location details based on the ZIP code
      const fullLocationData = await this.fetchLocationFromZipcode(locationData.postalCode);
      newListing.location = fullLocationData;
      seller.location = fullLocationData;
      await seller.save();
    }
    */

    return await newListing.save();
  } catch (error) {
      console.error(`Error creating listing`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else if (error.name === 'BadRequestException') {
        throw error;
      } else {
        throw new InternalServerErrorException('An unexpected error occurred', error);
      }
  }
}

private convertLocationDtoToSchema(locationDto: LocationDTO): any {
  const location = {
    postalCode: locationDto.postalCode,
    city: locationDto.city,
    state: locationDto.state,
  };

  if (locationDto.coordinates && locationDto.coordinates.length > 0) {
    const coordinates = locationDto.coordinates[0]; // Assuming you are sending only one set of coordinates
    location['coordinates'] = {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude] // [longitude, latitude]
    };
  }

  return location;
}
}

interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface PaginatedListingsResult {
  listings: Listing[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}