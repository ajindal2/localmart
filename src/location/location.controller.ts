import { Controller, Get, Query, HttpStatus, HttpException } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('/reverse-geocode')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return await this.locationService.reverseGeocode(parseFloat(lat), parseFloat(lng));
  }

  @Get('/validate-postal')
  async validateAndGeocodePostalCode(@Query('postalCode') postalCode: string) {
    return await this.locationService.validateAndGeocodePostalCode(postalCode);    
  }
}
