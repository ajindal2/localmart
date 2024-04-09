import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { SavedListingService } from './saved-listing.service';
import { CreateSavedListingDTO } from './dtos/create-saved-listing.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';


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
  async findAllByUser(@Param('userId') userId: string, @Req() req: Request) {
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
      throw new UnauthorizedException('User is not authorized to view saved listing');
    }
    
    return await this.savedListingService.findAllByUser(userId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.savedListingService.remove(id);
  }

  @Get('check-status/:userId/:listingId')
  async checkSavedStatus(@Param('userId') userId: string, @Param('listingId') listingId: string) {
    // This is not authorized route. So not using userId from req.
    return await this.savedListingService.checkSavedStatus(userId, listingId);
  }
}
