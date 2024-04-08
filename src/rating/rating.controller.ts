import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDTO } from './dtos/create-rating.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('ratings')
export class RatingController {
  constructor(private ratingService: RatingService) {}

  /*@Post()
  @UseGuards(JwtAuthGuard)
  async createRating(@Req() req, @Body() createRatingDto: CreateRatingDTO) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }

    // Extract userId and check if it exists
    const userId = req.user['userId']; // Adjust the path according to how your user object is structured
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return await this.ratingService.createRating(userId, createRatingDto);
  }*/

  @Post()
  @UseGuards(JwtAuthGuard) 
  async createRating(@Body() createRatingDTO: CreateRatingDTO) {
    return await this.ratingService.createRating(createRatingDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/exists')
  async checkRatingExists(@Query('listingId') listingId: string, 
    @Query('ratedBy') ratedBy: string, @Query('ratedUser') ratedUser: string,
  ) {
    return this.ratingService.checkRatingExists(listingId, ratedBy, ratedUser);
  }

  @Get()
  async getAllRatings() {
    return await this.ratingService.findAllRatings();
  }

  @Get(':id')
  async getRatingById(@Param('id') id: string) {
    return await this.ratingService.findRatingById(id);
  }

  @Get('seller/:sellerId')
  async getRatingsWithProfilesBySellerId(@Param('sellerId') sellerId: string) {
    const result = await this.ratingService.findRatingsWithProfilesBySellerId(sellerId);
    return result;
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getRatingsByUser(@Param('userId') userId: string) {
    // Right now this is used to vew My ratings from Account screen. In future it can be expanded to view ratings for nay user. Hence, do use Request object to for auth.
    const result = await this.ratingService.getRatingsByUser(userId);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteRating(@Req() req, @Param('id') id: string) {
    if (!req.user) {
      throw new UnauthorizedException('No user object found in request');
    }
    // Extract userId and check if it exists
    const userId = req.user['userId']; // Adjust the path according to how your user object is structured
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return await this.ratingService.deleteRating(id, userId);
  }
}
