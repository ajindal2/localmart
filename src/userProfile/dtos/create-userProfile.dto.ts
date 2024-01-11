import { IsNotEmpty, IsOptional, IsString, IsMongoId, IsArray, ArrayMinSize, IsEnum, ValidateNested, ValidateIf, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDTO {
  @IsEnum(['Point', 'ZipCode'])
  type: string;

  @IsArray()
  @IsOptional()
  coordinates?: number[];

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

export class CreateUserProfileDTO {

  @IsMongoId()
  @IsNotEmpty()
  userId: string; // This should be the user's ObjectId as a string

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  aboutMe?: string;

  @ValidateNested()
  @Type(() => LocationDTO)
  @IsOptional()
  location?: LocationDTO;
}