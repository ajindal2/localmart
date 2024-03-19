import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDTO } from './dtos/create-rating.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('ratings')
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Post()
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

    return this.ratingService.createRating(userId, createRatingDto);
  }

  @Get()
  async getAllRatings() {
    return this.ratingService.findAllRatings();
  }

  @Get(':id')
  async getRatingById(@Param('id') id: string) {
    return this.ratingService.findRatingById(id);
  }

  @Get('seller/:sellerId')
  async getRatingsWithProfilesBySellerId(@Param('sellerId') sellerId: string) {
    const result = await this.ratingService.findRatingsWithProfilesBySellerId(sellerId);
    return result;
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getRatingsByUser(@Param('userId') userId: string) {
    const result = await this.ratingService.getRatingsByUser(userId);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
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

    return this.ratingService.deleteRating(id, userId);
  }
}
