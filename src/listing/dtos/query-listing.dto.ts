import { IsOptional, IsNumber, IsString } from 'class-validator';

export class QueryListingDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  // Add more query parameters like location, distance
}