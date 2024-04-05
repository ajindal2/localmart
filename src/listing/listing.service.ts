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
  
      let queryConditions = { state: { $ne: 'Sold' } }; // Exclude 'Sold' listings
  
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
        const listings = await this.listingModel.find({ state: { $ne: 'Sold' } }) // $ne selects the documents where the value of the field is not equal to the specified value
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
          throw new Error('Invalid location data');
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

      if (locationData && locationData.postalCode && !locationData.coordinates) {
        // Only ZIP code provided, fetch coordinates and city from Google API
        const isValidZipcode = await this.isZipcodeValid(locationData.postalCode);
        if (!isValidZipcode) {
          console.log('Invalid ZIP code: ', locationData.postalCode);
          throw new Error('Invalid ZIP code');
        }
    
        // Fetch full location details based on the ZIP code
        const fullLocationData = await this.fetchLocationFromZipcode(locationData.postalCode);
        listing.location = fullLocationData;
      }
    
      // Save the updated listing
      return await listing.save();
    } catch (error) {
      console.error(`Error updating listing ${listingId}`, error);
      if (error.name === 'NotFoundException') {
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

/*async createListing(userId: string, createListingDto: CreateListingDTO): Promise<Listing> {
  console.log('Inside service method of createListing. Logging passed-in userId: ', userId);

  // Find the seller or create a new one if it doesn't exist
  // The findOneAndUpdate method with the upsert option is used to either find the existing seller or create a new one. 
  const seller = await this.sellerModel.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  );

  console.log('Logging sellerId: ', seller._id);

  // Convert DTO to Mongoose schema format if necessary
  // Update the selelr schema with the location if seller has added a new one
  // TODO add a check if location is empty
  const location = this.convertLocationDtoToSchema(createListingDto.location);
  if (JSON.stringify(seller.location) !== JSON.stringify(location)) {
    seller.location = location;
    await seller.save();
  }

  // Create a new listing
  const newListing = new this.listingModel({
    ...createListingDto,
    seller: seller._id,
    state: 'active',
  });

  // Handle location update
  if(createListingDto.location) {
    if(createListingDto.location.postalCode && !createListingDto.location.coordinates) {
      // Only ZIP code provided, fetch coordinates and city from Google API
      const isValidZipcode = await this.isZipcodeValid(createListingDto.location.postalCode);
      if (!isValidZipcode) {
        throw new Error('Invalid ZIP code');
      }
      const locationData = await this.fetchLocationFromZipcode(createListingDto.location.postalCode);
      newListing.location = locationData;
    } else {
      // Directly use provided location data (coordinates and city)
      const locationData = this.convertLocationDtoToSchema(createListingDto.location);
      newListing.location = locationData;
    }
  }

  return await newListing.save();
}*/

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
        throw new Error('Invalid location data');
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

    // Create a new listing
    const newListing = new this.listingModel({
      ...createListingDto,
      sellerId: seller._id,
      state: 'Available',
      location: convertedLocation
    });

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
    return await newListing.save();
  } catch (error) {
    console.error(`Error creating listing`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
  }
}

private async fetchLocationFromZipcode(zipcode: string): Promise<any> {
  // Google Geocoding API URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=AIzaSyCjS6WbSux7d1QQcjENuojKTvAzAtH9xn8`;

  try {
    const response = await axios.get(url);
    const location = response.data.results[0].geometry.location;
    const city = response.data.results[0].address_components.find(component => component.types.includes('locality')).long_name;

    return {
      coordinates: {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      },
      city: city,
      postalCode: zipcode
    };
  } catch (error) {
    // Handle error (e.g., log it, return null, or throw an exception)
    console.error(error);
    return null;
  }
}

async isZipcodeValid(zipcode: string): Promise<boolean> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=AIzaSyCjS6WbSux7d1QQcjENuojKTvAzAtH9xn8`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;

    if (results.length === 0) {
      // No results found for the ZIP code
      return false;
    }

    // Check if the response contains a postal_code type in address components
    const isValid = results.some(result => 
      result.address_components.some(component => 
        component.types.includes('postal_code')
      )
    );

    return isValid;
  } catch (error) {
    console.error('Error validating ZIP code:', error);
    throw new Error('Error validating ZIP code');
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