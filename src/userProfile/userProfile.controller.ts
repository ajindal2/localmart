import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { UserProfileService } from './userProfile.service';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';


@Controller('userProfile')
export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUserProfile(@Body() createUserProfileDto: CreateUserProfileDTO) {
    return await this.userProfileService.createUserProfile(createUserProfileDto);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('/:userId')
  async getUserProfile(@Param('userId') userId: string) {    
    return await this.userProfileService.getUserProfile(userId);
  }

  @Get('/:userId/location')
  @UseGuards(JwtAuthGuard)
  async getUserLocation(@Param('userId') userId: string) {
    return await this.userProfileService.getUserLocation(userId);
  }

  // Will use this endpoint to createOrUpdate UserProfile.
  @UseGuards(JwtAuthGuard)
  @Put('/:userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserProfile(@Param('userId') userId: string, @Body() updateUserProfileDto: UpdateUserProfileDTO) {
    return await this.userProfileService.createOrUpdateProfile(userId, updateUserProfileDto);
  }

  @Delete('/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteUserProfile(@Param('userId') userId: string) {
    await this.userProfileService.deleteUserProfile(userId);
  }

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

    // Process the files, store them, and get their URLs
    const imageUrl =  `${protocol}://${host}/uploads/${file.filename}`;

    const updatedProfile = await this.userProfileService.createOrUpdateProfileWithImage(userId, imageUrl);
    return { profile: updatedProfile };
  }
}