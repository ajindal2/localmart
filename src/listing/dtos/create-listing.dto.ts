import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

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

    @IsNotEmpty()
    @IsString()
    listingImageUrl: string;
  }