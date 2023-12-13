import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { UserProfileService } from './userProfile.service';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import axios from 'axios';
import * as FormData from 'form-data';
import { use } from 'passport';
import { diskStorage } from 'multer';
import { Request } from 'express';


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

  // Will use this endpoint to createOrUpdate UserProfile.
  @UseGuards(JwtAuthGuard)
  @Put(':userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserProfile(@Param('userId') userId: string, @Body() updateUserProfileDto: UpdateUserProfileDTO) {
    return this.userProfileService.createOrUpdateProfile(userId, updateUserProfileDto);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  async deleteUserProfile(@Param('userId') userId: string) {
    await this.userProfileService.deleteUserProfile(userId);
  }

  /*@Put('/:userId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the field in the request
  async updateProfileImage(@UploadedFile() file, @Param('userId') userId: string) {
    if (!file) throw new BadRequestException('Invalid file upload.');

    // Assuming your Python server has an endpoint to handle the file upload
    const pythonServerURL = ' http://192.168.86.49:9000/upload'; 
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      // Send the file to the Python server
      const response = await axios.post(pythonServerURL, formData, {
        headers: formData.getHeaders(),
      });

      // TODO only added for debugging
      if (response.status === 200) {
        console.log('Upload successful. Image URL:', response.data.imageUrl);
      } else {
          console.log('Upload failed:', response.data.message);
      }
      // Assuming the Python server returns the URL of the uploaded image
      const imageUrl = response.data.imageUrl;

    // Call a method in your service that will handle either creation or update
    const updatedProfile = await this.userProfileService.createOrUpdateProfileWithImage(userId, imageUrl);
    return { profile: updatedProfile };
  } catch (error) {
    console.error('Failed to upload image to the Python server: ', error);
    throw new BadRequestException('Failed to upload image to the Python server');
  }
}*/

@Put('/:userId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // specify the destination directory
      filename: (req, file, callback) => {
        // generate a unique filename
        const uniqueName = `${Date.now()}-${file.originalname}`;
        callback(null, uniqueName);
      },
    }),
  }))
  async updateProfileImage(
    @UploadedFile() file: Express.Multer.File, @Req() req: Request,
    @Param('userId') userId: string) {

    if (!file) throw new BadRequestException('Invalid file upload.');

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'; 
    const host = req.headers['host'] || req.get('host') || 'localhost:3000';

    console.log('protocol: ', protocol);
    // Process the files, store them, and get their URLs
    const imageUrl =  `${protocol}://${host}/uploads/${file.filename}`;
    console.log('Generated File URL:', imageUrl);


    const updatedProfile = await this.userProfileService.createOrUpdateProfileWithImage(userId, imageUrl);
    return { profile: updatedProfile };
  }
}