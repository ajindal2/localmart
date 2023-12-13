import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile } from './schemas/userProfile.schema';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import * as multer from 'multer';
import mongoose from 'mongoose';

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

  async deleteUserProfile(userId: string): Promise<void> {
    const objectId = new mongoose.Types.ObjectId(userId);
    const result = await this.userProfileModel.deleteOne({ userId: objectId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`UserProfile with user ID ${userId} not found`);
    }
  }

  async createOrUpdateProfile(userId: string, updateUserProfileDto: UpdateUserProfileDTO) : Promise<UserProfile> {
   
    const objectId = new mongoose.Types.ObjectId(userId);
    let userProfile = await this.userProfileModel.findOne({ userId: objectId });

    if (!userProfile) {
        // Define newUserProfileData with the UserProfile type
        const newUserProfileData: Partial<UserProfile> = {
            userId: new Types.ObjectId(userId),
        };

        /*if (updateUserProfileDto.profilePicture) {
            newUserProfileData.profilePicture = updateUserProfileDto.profilePicture; // Only set if imageUrl is provided
        }*/
        
        if(updateUserProfileDto.aboutMe) {
            newUserProfileData.aboutMe = updateUserProfileDto.aboutMe;
        }
        const newUserProfile = new this.userProfileModel(newUserProfileData);
        userProfile = await newUserProfile.save();
    } else {

        // If the user profile exists, update it
       /* if (updateUserProfileDto.profilePicture) {
            userProfile.profilePicture = updateUserProfileDto.profilePicture;
        }*/
        if(updateUserProfileDto.aboutMe) {
            userProfile.aboutMe = updateUserProfileDto.aboutMe;
        }
        userProfile = await userProfile.save();
      }
  
      return userProfile; 
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