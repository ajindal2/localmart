import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
  
  async createUser(createUserDTO: CreateUserDTO): Promise<User> {
    const { userName, displayName, emailAddress } = createUserDTO;

    // Check for existing user by username
    const existingUserByUsername = await this.userModel.findOne({ userName }).exec();
    if (existingUserByUsername) {
      throw new ConflictException(`Username '${userName}' is already taken.`);
    }

    // Check for existing user by email
    const existingUserByEmail = await this.userModel.findOne({ emailAddress }).exec();
    if (existingUserByEmail) {
      throw new ConflictException(`Email address '${emailAddress}' is already in use.`);
    }

     // Check for existing user by displayName
     const existingUserByDisplayName = await this.userModel.findOne({ displayName }).exec();
     if (existingUserByDisplayName) {
       throw new ConflictException(`Display Name '${displayName}' is already in use.`);
     }
     
    const newUser = await this.userModel.create(createUserDTO);
    newUser.password = await bcrypt.hash(newUser.password, 10);
    return newUser.save();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ emailAddress: email  }).exec();
    return user;
  }

  async updateSystemPassword(userId: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).exec();
    if (!updatedUser) {
      console.log(`User with ID ${userId} not found`);
    }
    return updatedUser;
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDTO): Promise<void> {
    const { currentPassword, newPassword } = updatePasswordDto;
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        console.log('User not found: ', userId);
        throw new NotFoundException('User not found');
      }

      const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordsMatch) {
        console.log('Current password is incorrect: ' );
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();
    } catch (error) {
      console.error(`Error updating password for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB Validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }

  async findByUsername(userName: string): Promise<User> {
    return await this.userModel.findOne({ userName }).exec();
  }

  // Fetch a user by ID
  public async findByUserId(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  // Update a user by ID
  public async updateById(userId: string, updateUserDto: UpdateUserDTO): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateUserDto, { new: true }).exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return updatedUser;
  }

  async deleteById(id: ObjectId): Promise<void> {
    await this.userModel.findByIdAndRemove(id).exec();
  }

  async updatePushToken(userId: string, pushToken: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // If the user already has this pushToken, no need to add it again
      if (!user.pushTokens.includes(pushToken)) {
        user.pushTokens.push(pushToken);
        await user.save();
      }
    
      return user;
    } catch (error) {
      console.error(`Error updating push token for userId ${userId}`, error);
      if (error.name === 'NotFoundException') {
        throw error;
      } else if (error.name === 'ValidationError') {
        throw new BadRequestException('DB validation failed');
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }
}
