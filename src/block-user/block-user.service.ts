import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlockUser, BlockUserDocument } from './schemas/block-user.schema';

@Injectable()
export class BlockUserService {
  constructor(
    @InjectModel(BlockUser.name) private blockUserModel: Model<BlockUserDocument>,
  ) {}

  async blockUser(blockerId: string, blockedId: string): Promise<BlockUser> {
    try {
      // Validate input
      if (!blockerId || !blockedId) {
        throw new BadRequestException('Both blockerId and blockedId must be provided');
      }

      // Prevent self-blocking
      if (blockerId === blockedId) {
        throw new BadRequestException('You cannot block yourself');
      }

      // Check if the block already exists
      const existingBlock = await this.blockUserModel.findOne({ blockerId, blockedId });
      if (existingBlock) {
        throw new BadRequestException('This user is already blocked');
      }

      // Create a new block record
      const block = new this.blockUserModel({ blockerId, blockedId });
      await block.save();

      return block;
    } catch (error) {
        console.error(`Error blocking user with blockerId: ${blockerId} and blockedId: ${blockedId}`, error);
        // Handle specific errors
        if (error instanceof BadRequestException) {
            throw error;
        } else if (error instanceof NotFoundException) {
            throw error;
        } else {
            throw new InternalServerErrorException('An unexpected error occurred while blocking the user');
        }    
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      if (!blockerId || !blockedId) {
        throw new BadRequestException('Both blockerId and blockedId must be provided');
      }

      const result = await this.blockUserModel.deleteOne({ blockerId, blockedId });

      if (result.deletedCount === 0) {
        throw new NotFoundException(`Block relationship does not exist between these users`);
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error unblocking user with blockerId: ${blockerId} and blockedId: ${blockedId}`, error);
      throw new InternalServerErrorException('An unexpected error occurred while unblocking the user');
    }
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      if (!blockerId || !blockedId) {
        return false;
        //throw new BadRequestException('Both blockerId and blockedId must be provided');
      }

      const block = await this.blockUserModel.findOne({ blockerId, blockedId });
      return !!block;
    } catch (error) {
        console.error(`Error checking block status for blockerId: ${blockerId} and blockedId: ${blockedId}`, error);
        return false; // return fasle to not block messages
        /*if (error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred while checking block status');*/
    }
  }
}
