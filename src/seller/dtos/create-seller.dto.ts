import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { LocationDTO } from 'src/location/dtos/location.dto';

export class CreateSellerDTO {
  @IsMongoId()
  @IsNotEmpty()
  userId: string; // Reference to the User's ObjectId as a string

  @ValidateNested()
  @Type(() => LocationDTO)
  @IsOptional()
  location?: LocationDTO;
}
