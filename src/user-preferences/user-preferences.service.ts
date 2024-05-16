import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserPreferences, UserPreferencesDocument } from './schemas/user-preferences.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectModel(UserPreferences.name) private userPreferencesModel: Model<UserPreferencesDocument>
  ) {}

  async getSearchDistance(userId: string): Promise<number> {
    try {
        if (!userId) throw new BadRequestException('User ID must be provided');

        const userPreferences = await this.userPreferencesModel.findOne({ userId }).exec();
        if (!userPreferences) {
        throw new NotFoundException(`User preferences not found for user ID: ${userId}`);
        }
        return userPreferences.searchDistance;
    } catch (error) {
        console.error(`Error fetching search distance for userId ${userId}`, error);
        if (error.name === 'ValidationError') {
          throw new BadRequestException('DB Validation failed');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
  }

  async updateSearchDistance(userId: string, searchDistance: number): Promise<UserPreferences> {
    try {
        if (!userId) throw new BadRequestException('User ID must be provided');
        if (searchDistance <= 0) throw new BadRequestException('Search distance must be a positive number');

        const updatedPreferences = await this.userPreferencesModel.findOneAndUpdate(
        { userId },
        { searchDistance },
        { new: true, upsert: true } // upsert option creates the document if it doesn't exist
        ).exec();

        if (!updatedPreferences) {
        throw new NotFoundException(`User preferences could not be updated for user ID: ${userId}`);
        }
        return updatedPreferences;
    } catch (error) {
        console.error(`Error fetching search distance for userId ${userId}`, error);
        if (error.name === 'ValidationError') {
          throw new BadRequestException('DB Validation failed');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
  }
}
