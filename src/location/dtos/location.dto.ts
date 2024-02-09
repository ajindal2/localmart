import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Validate } from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDTO {
    @IsNumber()
    longitude: number;

    @IsNumber()
    latitude: number;
}

export class LocationDTO {
    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CoordinatesDTO)
    @IsOptional()
    coordinates?: CoordinatesDTO[];
}
