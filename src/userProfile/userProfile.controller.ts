import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { UserProfileService } from './userProfile.service';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import axios from 'axios';

@Controller('userProfile')
export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  //@UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUserProfile(@Body() createUserProfileDto: CreateUserProfileDTO) {
    return this.userProfileService.createUserProfile(createUserProfileDto);
  }

  @Get(':userId')
  async getUserProfile(@Param('userId') userId: string) {
    return this.userProfileService.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserProfile(@Param('userId') userId: string, @Body() updateUserProfileDto: UpdateUserProfileDTO) {
    return this.userProfileService.updateUserProfile(userId, updateUserProfileDto);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  async deleteUserProfile(@Param('userId') userId: string) {
    await this.userProfileService.deleteUserProfile(userId);
  }

  @Put('/:userId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the field in the request
  async updateProfileImage(@UploadedFile() file, @Param('userId') userId: string) {
    if (!file) throw new BadRequestException('Invalid file upload.');

    // Assuming your Python server has an endpoint to handle the file upload
    const pythonServerURL = 'http://localhost:5000/upload'; // Replace with your Python server's URL
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    try {
      // Send the file to the Python server
      const response = await axios.post(pythonServerURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Assuming the Python server returns the URL of the uploaded image
      const imageUrl = response.data.imageUrl;

    // Call a method in your service that will handle either creation or update
    const updatedProfile = await this.userProfileService.createOrUpdateProfileWithImage(userId, imageUrl);
    return { profile: updatedProfile };
  } catch (error) {
    throw new BadRequestException('Failed to upload image to the Python server');
  }
}
}