import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile } from './schemas/userProfile.schema';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import * as multer from 'multer';
import mongoose from 'mongoose';
import { LocationDTO } from 'src/shared/location.dto';
import axios from 'axios';

@Injectable()
export class UserProfileService {
  constructor(@InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>) { }

  async createUserProfile(createUserProfileDto: CreateUserProfileDTO): Promise<UserProfile> {
    const newUserProfile = await this.userProfileModel.create(createUserProfileDto);
    return newUserProfile.save();
  }

  async updateUserProfile(userId: string, updateUserProfileDto: UpdateUserProfileDTO): Promise<UserProfile> {
    const updatedUserProfile =  await this.userProfileModel.findOneAndUpdate({ userId: userId }, updateUserProfileDto, { new: true });
    if (!updatedUserProfile) {
        throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
      }
      return updatedUserProfile;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const userProfile = await this.userProfileModel.findOne({ userId: objectId });
    if (!userProfile) {
      throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
    }
    return userProfile;
  }

  async getUserLocation(userId: string) {
    const objectId = new mongoose.Types.ObjectId(userId);
    const userProfile = await this.userProfileModel.findOne({ userId: objectId  });
    if (!userProfile) {
      console.log('User profile not found to fetch user location ');
      // Impotant to thro thsi exception since it is a 404 and we are checking for 404 in the FE
      throw new NotFoundException('User profile not found');
    }
    return userProfile.location || null;
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const result = await this.userProfileModel.deleteOne({ userId: objectId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
    }
  }

  async createOrUpdateProfile(userId: string, updateUserProfileDto: UpdateUserProfileDTO): Promise<UserProfile> {
    const objectId = new Types.ObjectId(userId);
    let userProfile = await this.userProfileModel.findOne({ userId: objectId });

    if (!userProfile) {
      // Handling creation of new UserProfile
      userProfile = new this.userProfileModel({ userId: objectId });
    }

    // Update fields other than location...
    if(updateUserProfileDto.aboutMe !== undefined) {
      userProfile.aboutMe = updateUserProfileDto.aboutMe;
    }

    // Handle location update
    if(updateUserProfileDto.location) {
      if(updateUserProfileDto.location.postalCode && !updateUserProfileDto.location.coordinates) {
        // Only ZIP code provided, fetch coordinates and city from Google API
        const isValidZipcode = await this.isZipcodeValid(updateUserProfileDto.location.postalCode);
        if (!isValidZipcode) {
          throw new Error('Invalid ZIP code');
        }
        const locationData = await this.fetchLocationFromZipcode(updateUserProfileDto.location.postalCode);
        userProfile.location = locationData;
      } else {
        // Directly use provided location data (coordinates and city)
        const locationData = this.convertLocationDtoToSchema(updateUserProfileDto.location);
        userProfile.location = locationData;
      }
    }

    return userProfile.save();
  }

  private convertLocationDtoToSchema(locationDto: LocationDTO): any {
    const location = {
      postalCode: locationDto.postalCode,
      city: locationDto.city,
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

  async createOrUpdateProfileWithImage(userId: string, imageUrl: string): Promise<UserProfile> {
    const objectId = new mongoose.Types.ObjectId(userId);
    let userProfile = await this.userProfileModel.findOne({ userId: objectId });
    console.error("image upload request for userId: ", userId);

    if (!userProfile) {
        // Define newUserProfileData with the UserProfile type
        const newUserProfileData: Partial<UserProfile> = {
            userId: new Types.ObjectId(userId),
        };

        if (imageUrl) {
            newUserProfileData.profilePicture = imageUrl; // Only set if imageUrl is provided
        }
        
        const newUserProfile = new this.userProfileModel(newUserProfileData);
        userProfile = await newUserProfile.save();
    } else {
      // If the user profile exists, update it
      if(imageUrl) {
        userProfile.profilePicture = imageUrl;
    }
    userProfile = await userProfile.save();
  }

    return userProfile;
  }
}