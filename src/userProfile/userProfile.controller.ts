import { Controller, Get, Post, Body, Param, Put, Delete, UsePipes, ValidationPipe, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserProfileService } from './userProfile.service';
import { CreateUserProfileDTO } from './dtos/create-userProfile.dto';
import { UpdateUserProfileDTO } from './dtos/update-userProfile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ImageUploadService } from 'src/image-upload/image-upload.service';


@Controller('userProfile')
export class UserProfileController {
  constructor(private userProfileService: UserProfileService,
    private imageUploadService: ImageUploadService 
    ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUserProfile(@Body() createUserProfileDto: CreateUserProfileDTO) {
    return await this.userProfileService.createUserProfile(createUserProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:userId')
  async getUserProfile(@Param('userId') userId: string, @Req() req: Request) {   

    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== userId) {
      throw new UnauthorizedException('User is not authorized');
    }
     
    return await this.userProfileService.getUserProfile(userId);
  }

  @Get('/:userId/location')
  @UseGuards(JwtAuthGuard)
  async getUserLocation(@Param('userId') userId: string, @Req() req: Request) {

    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== userId) {
      throw new UnauthorizedException('User is not authorized');
    }

    return await this.userProfileService.getUserLocation(userId);
  }

  // Will use this endpoint to createOrUpdate UserProfile.
  @UseGuards(JwtAuthGuard)
  @Put('/:userId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserProfile(@Param('userId') userId: string, @Body() updateUserProfileDto: UpdateUserProfileDTO, @Req() req: Request) {

    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userIdFromReq = req.user['userId']; 
    if (!userIdFromReq) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Extra layer of validation to ensure the userId from the params matches the one from the token
    if (userIdFromReq !== userId) {
      throw new UnauthorizedException('User is not authorized');
    }

    return await this.userProfileService.createOrUpdateProfile(userId, updateUserProfileDto);
  }

  @Delete('/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteUserProfile(@Param('userId') userId: string) {
    await this.userProfileService.deleteUserProfile(userId);
  }

  @Put('/:userId/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updateProfileImage(
    @UploadedFile() file: Express.Multer.File, @Req() req: Request,
    @Param('userId') userId: string) {
      if (!req.user) {
        throw new UnauthorizedException('No user object found in request');
      }
  
      // Extract userId and check if it exists
      const userIdFromReq = req.user['userId']; 
      if (!userIdFromReq) {
        throw new UnauthorizedException('User ID not found in request');
      }
  
      // Extra layer of validation to ensure the userId from the params matches the one from the token
      if (userIdFromReq !== userId) {
        throw new UnauthorizedException('User is not authorized');
      }

      if (!file) throw new BadRequestException('Invalid file upload.');

      const imageUrl = await  this.imageUploadService.uploadFile(userId, file, 'profile')

      const updatedProfile = await this.userProfileService.createOrUpdateProfileWithImage(userId, imageUrl);
      return { profile: updatedProfile };
    }
}