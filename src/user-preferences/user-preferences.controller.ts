import { Controller, Get, Param, Put, Body, ParseIntPipe, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get('/:userId/search-distance')
  async getSearchDistance(@Param('userId') userId: string): Promise<number> {
      const searchDistance = await this.userPreferencesService.getSearchDistance(userId);
      return searchDistance;
  }

  @Put('/:userId/search-distance')
  @UseGuards(JwtAuthGuard)
  async updateSearchDistance(
    @Param('userId') userId: string,
    @Body('searchDistance', ParseIntPipe) searchDistance: number
  ): Promise<{ searchDistance: number }> {
      const updatedPreferences = await this.userPreferencesService.updateSearchDistance(userId, searchDistance);
      return { searchDistance: updatedPreferences.searchDistance };
    } 
}
