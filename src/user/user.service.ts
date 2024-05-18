import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdatePasswordDTO } from './dtos/update-password.dto';


@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }
  private logger: Logger = new Logger('UserService');

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
  
  async createUser(createUserDTO: CreateUserDTO): Promise<User> {
    try {
      const { displayName, emailAddress } = createUserDTO;

      // Check for existing user by email with case-insensitive search
      const existingUserByEmail = await this.userModel.findOne({
        emailAddress: { $regex: new RegExp('^' + emailAddress + '$', 'i') }
      }).exec();
      if (existingUserByEmail) {
        throw new ConflictException(`Email address '${emailAddress}' is already in use.`);
      }

      // Check for existing user by displayName with case-insensitive search
      const existingUserByDisplayName = await this.userModel.findOne({  
        displayName: { $regex: new RegExp('^' + displayName + '$', 'i') }
      }).exec();
      if (existingUserByDisplayName) {
        throw new ConflictException(`Display Name '${displayName}' is already in use.`);
      }
      
      const newUser = await this.userModel.create(createUserDTO);
      newUser.password = await bcrypt.hash(newUser.password, 10);
      return newUser.save();
      } catch (error) {
        this.logger.error(`Error creating user for email: ${createUserDTO.emailAddress}`, error);
        if (error.name === 'ConflictException') {
          throw error;
        } else if (error.name === 'ValidationError') {
          throw new BadRequestException('DB Validation failed when creating new user');
        } else {
          throw new InternalServerErrorException('An unexpected error occurred when creating new user');
        }
      }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.userModel.findOne({ emailAddress: email  }).exec();
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when finding user by email');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when finding user by email');
      }
    }
  }

  // Update password when system generated password reset email is sent.
  async updateSystemPassword(userId: string, newPassword: string): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).exec();
      if (!updatedUser) {
        this.logger.error(`User with ID ${userId} not found in updateSystemPassword`);
      }
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating system password for user: ${userId}`, error);
      if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when updating system password');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when updating system password');
      }
    }
  }

  // Update password when user manually udpates their password.
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDTO): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto;
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordsMatch) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();
    } catch (error) {
      this.logger.error(`Error updating password for userId ${userId}`, error);
      if (error.name === 'NotFoundException' || error.name === 'BadRequestException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when updating user password');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when updating user password');
      }
    }
  }

  // Fetch a user by ID
  public async findByUserId(userId: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when finding user by userId');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when finding user by userId');
      }
    }
  }

  // Update a user by ID
  public async updateById(userId: string, updateUserDto: UpdateUserDTO): Promise<User> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).exec();
      if (!updatedUser) {
        throw new NotFoundException(`User with ID not found`);
      }
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user by userId  ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed when updating user by userId');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when updating user by userId');
      }
    }
  }

  // Not in use
  async deleteById(id: ObjectId): Promise<void> {
    await this.userModel.findByIdAndRemove(id).exec();
  }

  async updatePushToken(userId: string, pushToken: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User with ID not found`);
      }
      
      // If the user already has this pushToken, no need to add it again
      if (!user.pushTokens.includes(pushToken)) {
        user.pushTokens.push(pushToken);
        await user.save();
      }
    
      return user;
    } catch (error) {
      this.logger.error(`Error updating push token ${pushToken} for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed when updating push token');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred when updating push token');
      }
    }
  }
}
