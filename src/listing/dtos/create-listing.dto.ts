import { IsString, IsNumber, IsOptional, IsNotEmpty, IsMongoId, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class CreateListingDTO {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
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
    @IsIn(['active', 'archive', 'sold'])
    state: string; // State of the listing
  }