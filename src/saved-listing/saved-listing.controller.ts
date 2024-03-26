import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { SavedListingService } from './saved-listing.service';
import { CreateSavedListingDTO } from './dtos/create-saved-listing.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('savedListings')
export class SavedListingController {
  constructor(private readonly savedListingService: SavedListingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createSavedListingDto: CreateSavedListingDTO) {
    const listSaved = await this.savedListingService.create(createSavedListingDto);
    return listSaved;
  }

  @Get('/:userId')
  @UseGuards(JwtAuthGuard)
  async findAllByUser(@Param('userId') userId: string) {
    return await this.savedListingService.findAllByUser(userId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.savedListingService.remove(id);
  }

  @Get('check-status/:userId/:listingId')
  async checkSavedStatus(@Param('userId') userId: string, @Param('listingId') listingId: string) {
    return await this.savedListingService.checkSavedStatus(userId, listingId);
  }
}
