// query-listing.dto.ts
import { IsOptional, IsNumber, IsString, IsLongitude, IsLatitude, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationQuery {
  @IsLatitude()
  latitude?: number;

  @IsLongitude()
  longitude?: number;

  @IsNumber()
  maxDistance?: number; // in meters
}

export class QueryListingDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationQuery)
  location?: LocationQuery;
}
