import { IsMongoId } from 'class-validator';

export class CreateSavedListingDTO {
  @IsMongoId()
  user: string; // The ID of the user saving the listing

  @IsMongoId()
  listing: string; // The ID of the listing being saved
}