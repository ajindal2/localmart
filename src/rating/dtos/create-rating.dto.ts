import { IsNotEmpty, IsNumber, IsOptional, IsString, IsMongoId, Min, Max, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class CreateRatingDTO {
    @IsNotEmpty()
    @IsString()
    @IsIn(['seller', 'buyer'])
    role: string;
    
    @IsNotEmpty()
    @IsMongoId()
    listingId: string; // ID of the listing being rated

    @IsNotEmpty()
    @IsMongoId()
    ratedBy: string; // ID of the user giving the rating

    @IsNotEmpty()
    @IsMongoId()
    ratedUser: string; // ID of the user (seller/buyer) receiving the rating

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    stars: number; // Number of stars (1 to 5)

    @IsOptional()
    @IsString()
    text?: string; // Optional text review

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    tags?: string[]; // Array of tags for the rating
    
    // Note: The 'dateGiven' field is not included in the DTO because it is set by default in the schema
}
