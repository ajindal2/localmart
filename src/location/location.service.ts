import { Injectable, Inject, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';


@Injectable()
export class LocationService {
    constructor( private cacheService: CacheService) { }
    private logger: Logger = new Logger('LocationService');

    // Get city/postal from lat/long
    async reverseGeocode(lat: number, lng: number): Promise<any> {
        const cacheKey = `geo-${lat}-${lng}`;
        const cached = this.cacheService.get(cacheKey);

        if (cached) {
            // Check if the cached value is an error placeholder
            if (cached.error) {
                // Handle the previously cached error case, e.g., by retrying after a certain time
                const elapsedTime = Date.now() - cached.errorTimestamp;
                if (elapsedTime < 60000) { // 1 minute
                    throw new Error('Previous geocoding attempt failed, retrying too soon.');
                }
                // If enough time has passed, proceed to retry the geocoding request
            } else {
                return cached;
            }
        }

        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GEO_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                // Check if the result is in the US
                const isUSAddress = data.results[0].address_components.some(component => component.types.includes('country') && component.short_name === 'US');
                if (!isUSAddress) {
                    throw new BadRequestException('Location is not in the United States');
                }

                const result = {
                    formatted_address: data.results[0].formatted_address,
                    city: data.results[0]?.address_components?.find((component) => component.types.includes('locality'))?.long_name,
                    state: data.results[0]?.address_components?.find((component) => component.types.includes('administrative_area_level_1'))?.long_name,
                    postalCode: data.results[0]?.address_components?.find((component) => component.types.includes('postal_code'))?.long_name,
                    coordinates: [lng, lat] // Store in [longitude, latitude] format
                };

                this.cacheService.set(cacheKey, result, 600000); // Cache for 10 minute
                return result;
            } else {
                // Cache the error state without specific "unknown" result
                this.cacheService.set(cacheKey, { error: true, errorTimestamp: Date.now() }, 60000); // Cache this error state for shorter 1 minute.
                this.logger.error(`Failed to reverse geocode coordinates ${lat} ${lng}`, data.status);
                throw new Error('Failed to fetch location');
            }
        } catch (error) {
            this.logger.error(`Reverse geocoding error for ${lat} ${lng}`, error);
            if (error.name === 'BadRequestException') {
                throw error;
            } else {
                throw new InternalServerErrorException('An error occurred when fetching location');
            }
        }
    }
    
    // Validate zipcode and return location details
    async validateAndGeocodePostalCode(postalCode: string): Promise<any> {
        if (!this.isValidPostalCode(postalCode)) {
            throw new BadRequestException('Invalid postal code format');
        }
    
        const cacheKey = `postal-${postalCode}`;
        const cached = this.cacheService.get(cacheKey);
        if (cached) return cached;
    
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=${process.env.GEO_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.status === 'OK') {
                const addressComponents = data.results[0]?.address_components;
                const isUSAddress = addressComponents.some(component => component.types.includes('country') && (component.short_name === 'US' || component.long_name === 'United States'));
                if (!isUSAddress) {
                    throw new BadRequestException(`Postal code is not within the United States.`);
                }
            
                const result = this.processGeocodeResponse(data.results[0], postalCode);
                this.cacheService.set(cacheKey, result, 60000); // Cache the result for 1 minute
                return result;
            } else if (data.status === 'ZERO_RESULTS') {
                // If Google API returns no results, the postal code does not exist
                throw new BadRequestException(`Postal code not found '${postalCode}'`);
            } else {
                // Handle other API response statuses
                this.logger.error(`Failed to validate and geocode postal code: ${postalCode}`, data.status);
                throw new Error('Failed to fetch location.');
            }
        } catch (error) {
            this.logger.error(`ValidateAndGeocodePostalCode error for postal code ${postalCode}`, error);
            if (error.name === 'BadRequestException') {
                throw error;
            } else {
                throw new InternalServerErrorException('An error occurred when geocoding postal code');
            }
        }
    }

    private isValidPostalCode(postalCode: string): boolean {
        // This pattern matches US zip codes in the 5-digit format or the ZIP+4 format
        const pattern = /^\d{5}(-\d{4})?$/;

        return pattern.test(postalCode);
    }

    private processGeocodeResponse(result: any, postalCode: string): any {
        const city = result.address_components.find((component) => component.types.includes('locality'))?.long_name;
        const state = result.address_components.find((component) => component.types.includes('administrative_area_level_1'))?.long_name;
        const location = result.geometry.location;
        const formatted_address = result.formatted_address || null;

        return {
            city,
            state,
            postalCode: postalCode,
            coordinates: [location.lng, location.lat],
            formatted_address
        };
    }
}
