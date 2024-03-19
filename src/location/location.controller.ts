import { Controller, Get, Query, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/reverse-geocode')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return await this.locationService.reverseGeocode(parseFloat(lat), parseFloat(lng));
  }

  @UseGuards(JwtAuthGuard)
  @Get('/validate-postal')
  async validateAndGeocodePostalCode(@Query('postalCode') postalCode: string) {
    return await this.locationService.validateAndGeocodePostalCode(postalCode);    
  }
}
