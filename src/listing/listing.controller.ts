import { Controller, Post, Get, Put, Delete, Body, Param, Query, NotFoundException, UseInterceptors, UploadedFiles, Req, BadRequestException, UseGuards, UnauthorizedException, Patch } from '@nestjs/common';
import { ListingService } from './listing.service';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { CreateListingDTO } from './dtos/create-listing.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateListingDTO } from './dtos/update-listing.dto';

@Controller('listings')
export class ListingController {
  constructor(private listingService: ListingService) { }

  @Get('/')
  async getListings(@Query() queryListingDTO: QueryListingDTO) {
    if (Object.keys(queryListingDTO).length) {
      const filteredListings = await this.listingService.getFilteredListings(queryListingDTO);
      return filteredListings;
    } else {
      const allListings = await this.listingService.getAllListings();
      return allListings;
    }
  }

  @Get('/:id')
  async getListing(@Param('id') id: string) {
    const listing = await this.listingService.getListing(id);
    if (!listing) throw new NotFoundException('Product does not exist!');
    return listing;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: diskStorage({
      destination: './uploads', // specify the destination directory
      filename: (req, file, callback) => {
        // generate a unique filename
        const uniqueName = `${Date.now()}-${file.originalname}`;
        callback(null, uniqueName);
      },
    }),
  }))
  async createListing(
    @UploadedFiles() files: Express.Multer.File[], @Req() req: Request,
    @Body() createListingDto: CreateListingDTO) {

      if (!req.user) {
        throw new UnauthorizedException('No user object found in request');
      }
  
      // Extract userId and check if it exists
      const userId = req.user['userId']; // Adjust the path according to how your user object is structured
      if (!userId) {
        throw new UnauthorizedException('User ID not found in request');
      }
  
    // Check if images are uploaded
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'; 
    const host = req.headers['host'] || req.get('host') || 'localhost:3000';

    // Process the files, store them, and get their URLs
    const imageUrls = files.map(file => {
      const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
      return fileUrl;
    });

    // Add the image URLs to the DTO
    createListingDto.imageUrls = imageUrls;

    // Now call the service method to create the listing
    return this.listingService.createListing(userId, createListingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        callback(null, uniqueName);
      },
    }),
  }))
  async updateListing(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Body() updateListingDto: UpdateListingDTO
  ) {
      if (!req.user) {
        throw new UnauthorizedException('No user object found in request');
      }

      // Extract userId and check if it exists
      const userId = req.user['userId']; // Adjust the path according to how your user object is structured
      if (!userId) {
        throw new UnauthorizedException('User ID not found in request');
      }

    // Check if images are uploaded
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'; 
    const host = req.headers['host'] || req.get('host') || 'localhost:3000';

    // Process the files, store them, and get their URLs
    const imageUrls = files.map(file => {
      const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
      return fileUrl;
    });

    // Add the image URLs to the DTO
    updateListingDto.imageUrls = imageUrls;
    return this.listingService.updateListing(id, updateListingDto);
  }


  /*@Put('/:id')
  async updateListing(@Param('id') id: string, @Body() createListingDTO: CreateListingDTO) {
    const listing = await this.listingService.updateListing(id, createListingDTO);
    if (!listing) throw new NotFoundException('Listing does not exist!');
    return listing;
  }*/

  // Get listings for a specific user
  @Get('/user/:userId')
  async findListingsByUser(@Param('userId') userId: string) {
    return this.listingService.findListingsByUser(userId);
  }

  // Delete a listing
  @Delete('/:listingId')
  async deleteListing(@Param('listingId') listingId: string) {
    return this.listingService.deleteListing(listingId);
  }

  // Update listing status
  @Patch('/:listingId/status')
  async updateListingStatus(@Param('listingId') listingId: string, @Body('status') status: 'active' | 'delete' | 'sold') {
    return this.listingService.updateListingStatus(listingId, status);
  }
}
