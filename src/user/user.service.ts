import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Model, ObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

  async createUser(createUserDTO: CreateUserDTO): Promise<User> {
    const { userName, emailAddress } = createUserDTO;

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

    const newUser = await this.userModel.create(createUserDTO);
    newUser.password = await bcrypt.hash(newUser.password, 10);
    return newUser.save();
  }

  async findByUsername(userName: string): Promise<User> {
    return this.userModel.findOne({ userName }).exec();
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
  }
  
}
