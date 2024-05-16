import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile } from './schemas/userProfile.schema';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import mongoose from 'mongoose';
import { LocationDTO } from 'src/location/dtos/location.dto';

@Injectable()
export class UserProfileService {
  constructor(@InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>) { }

  async createUserProfile(createUserProfileDto: CreateUserProfileDTO): Promise<UserProfile> {
    const newUserProfile = await this.userProfileModel.create(createUserProfileDto);
    return await newUserProfile.save();
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      const userProfile = await this.userProfileModel.findOne({ userId: objectId });
      if (!userProfile) {
        throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
      }
      return userProfile;
    } catch (error) {
      console.error(`Error fetching user profile for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async getUserLocation(userId: string) {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      const userProfile = await this.userProfileModel.findOne({ userId: objectId  });
      if (!userProfile) {
        console.error(`User profile not found to fetch user location for ${userId}`);
        // Impotant to thro thsi exception since it is a 404 and we are checking for 404 in the FE
        throw new NotFoundException('User profile not found');
      }
      return userProfile.location || null;
    } catch (error) {
      console.error(`Error fetching user location for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async deleteUserProfile(userId: string): Promise<void> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const result = await this.userProfileModel.deleteOne({ userId: objectId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
    }
  }

  async createOrUpdateProfile(userId: string, updateUserProfileDto: UpdateUserProfileDTO): Promise<UserProfile> {
    try {
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
      if (updateUserProfileDto.location !== undefined) {
        const locationData = this.convertLocationDtoToSchema(updateUserProfileDto.location);
        userProfile.location = locationData;
      }
      return await userProfile.save();
    } catch (error) {
      console.error(`Error creating/ updating user profile for userId ${userId}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
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

  async createOrUpdateProfileWithImage(userId: string, imageUrl: string): Promise<UserProfile> {
    const objectId = new mongoose.Types.ObjectId(userId);
    let userProfile = await this.userProfileModel.findOne({ userId: objectId });

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