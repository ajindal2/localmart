import { Controller, Post, Get, Put, Delete, Body, Param, Query, NotFoundException, UseInterceptors, UploadedFiles, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { ListingService } from './listing.service';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { CreateListingDTO } from './dtos/create-listing.dto';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
    @Body() createListingDto: CreateListingDTO,
    @Param('userId') userId: string) {

    // Check if images are uploaded
    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'; 
    const host = req.headers['host'] || req.get('host') || 'localhost:3000';

    // Process the files, store them, and get their URLs
    const imageUrls = files.map(file => {
      console.log('File inside map: ', file);
      const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
      console.log('Generated File URL:', fileUrl);
      return fileUrl;
    });

    // Add the image URLs to the DTO
    createListingDto.imageUrls = imageUrls;

    // Now call the service method to create the listing
    return this.listingService.createListing(userId, createListingDto);
  }

  @Put('/:id')
  async updateListing(@Param('id') id: string, @Body() createListingDTO: CreateListingDTO) {
    const listing = await this.listingService.updateListing(id, createListingDTO);
    if (!listing) throw new NotFoundException('Listing does not exist!');
    return listing;
  }

  @Delete('/:id')
  async deleteListing(@Param('id') id: string) {
    const listing = await this.listingService.deleteListing(id);
    if (!listing) throw new NotFoundException('Listing does not exist');
    return listing;
  }
}

/**
 * 1. Add validations
 */