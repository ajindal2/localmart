import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsNotEmpty, IsMongoId, IsArray, ArrayNotEmpty, IsIn, ValidateNested } from 'class-validator';
import { LocationDTO } from 'src/location/dtos/location.dto';

export class CreateListingDTO {
    @IsNotEmpty({ message: 'Title cannot be empty' })
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty({ message: 'Price cannot be empty' })
    @IsNumber()
    price: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true }) // Validates that each item in the array is a string
    imageUrls: string[]; // An array of image URLs

    @IsMongoId()
    @IsNotEmpty()
    sellerId: string; // This should be the seller's ObjectId as a string

    @IsNotEmpty()
    @IsIn(['Available', 'Sold'])
    state: string; // State of the listing

    @ValidateNested()
    @Type(() => LocationDTO)
    location: LocationDTO; // Location is required
  }