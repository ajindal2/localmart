import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFiles, Req, BadRequestException, UseGuards, UnauthorizedException, Patch, ParseIntPipe, InternalServerErrorException, Logger } from '@nestjs/common';
import { ListingService } from './listing.service';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { CreateListingDTO } from './dtos/create-listing.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateListingDTO } from './dtos/update-listing.dto';
import { PaginatedListingsResult } from './listing.service'; 
import { ImageUploadService } from 'src/image-upload/image-upload.service';
import mongoose from 'mongoose';


@Controller('listings')
export class ListingController {
  constructor(
    private listingService: ListingService,
    private imageUploadService: ImageUploadService 
    ) { }

  private logger: Logger = new Logger('ListingController');

  @Get('/')
  async getListings(
    @Query() queryListingDTO: QueryListingDTO,
    @Query('page', ParseIntPipe) page: number = 1,  // Default to page 1 if not specified or if parsing fails
    @Query('limit', ParseIntPipe) limit: number = 50  // Default to 50 items per page if not specified or if parsing fails
  ): Promise<PaginatedListingsResult> {
    const paginationOptions = { page, limit };
    if (Object.keys(queryListingDTO).length) {
      const filteredListings = await this.listingService.getFilteredListings(queryListingDTO, paginationOptions);
      return filteredListings;
    } else {
      const allListings = await this.listingService.getAllListings(paginationOptions);
      return allListings;
    }
  }

  @Get('/:id')
  async getListing(@Param('id') id: string) {
    return await this.listingService.getListing(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:userId')
  @UseInterceptors(FilesInterceptor('images', 10))
  async createListing(
    @UploadedFiles() files: Express.Multer.File[], 
    @Req() req: Request, 
    @Param('userId') userId: string, 
    @Body() createListingDto: CreateListingDTO) {

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
        throw new UnauthorizedException('User is not authorized to create new listing');
      }

      // Create the listing without images
      /*const listing = await this.listingService.createListing(userId, createListingDto);
      if (!listing) {
        throw new InternalServerErrorException('Failed to create listing');
      }*/

      // Check if images are uploaded
      if (!files || files.length === 0) {
        throw new BadRequestException('No images provided');
      }

      // Process images asynchronously
      //this.processImagesAsynchronously(files, userId, listing._id);
      //return listing;

      // Use ImageUploadService to upload images to S3 and get their URLs
      const imageUrls = await Promise.all(files.map(file => 
        this.imageUploadService.uploadFile(userId, file, 'listing')
       ));

       // Add the S3 image URLs to the DTO
       createListingDto.imageUrls = imageUrls;

       // Now call the service method to create the listing
      return await this.listingService.createListing(userId, createListingDto);
    }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateListing(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Body() updateListingDto: UpdateListingDTO) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userId = req.user['userId']; 
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    // Check if images are uploaded
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    const imageUrls = await Promise.all(files.map(file => 
      this.imageUploadService.uploadFile(userId, file, 'listing')
    ));

    // Add the image URLs to the DTO
    updateListingDto.imageUrls = imageUrls;
    return await this.listingService.updateListing(id, updateListingDto);
  }

  // Get listings for a specific user
  //@UseGuards(JwtAuthGuard)
  @Get('/user/:userId')
  async findListingsByUser(@Param('userId') userId: string) {
    return await this.listingService.findListingsByUser(userId);
  }

  // Delete a listing
  @UseGuards(JwtAuthGuard)
  @Delete('/:listingId')
  async deleteListing(@Param('listingId') listingId: string) {
    return await this.listingService.deleteListing(listingId);
  }

  // Update listing status
  @UseGuards(JwtAuthGuard)
  @Patch('/:listingId/status')
  async updateListingStatus(@Param('listingId') listingId: string, @Body('status') status: 'Sold') {
    return await this.listingService.updateListingStatus(listingId, status);
  }

  private async processImagesAsynchronously(files: Express.Multer.File[], userId: string, listingId: mongoose.Types.ObjectId): Promise<void> {
    files.forEach(file => {
      this.imageUploadService.uploadFile(userId, file, 'listing')
        .then(url => {
          this.listingService.updateListingWithImageUrl(listingId, url)
        .catch(err => {
            console.error(`Error updating listing with image URL: ${err.message} for userId: ${userId} and listingId: ${listingId}`);
            throw new InternalServerErrorException("Failed to upload file");
          });
        })
        .catch(err => {
          console.error(`Error uploading image: ${err.message} for userId: ${userId} and listingId: ${listingId}`);
          throw new InternalServerErrorException('An unexpected error occurred when uploading images');
        });
    });
  }
}
