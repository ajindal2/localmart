import { Controller, Post, Get, Put, Delete, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ListingService } from './listing.service';
import { QueryListingDTO } from './dtos/query-listing.dto';
import { CreateListingDTO } from './dtos/create-listing.dto';

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

  @Post('/')
  async addListing(@Body() createListingDTO: CreateListingDTO) {
    const listing = await this.listingService.addListing(createListingDTO);
    return listing;
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