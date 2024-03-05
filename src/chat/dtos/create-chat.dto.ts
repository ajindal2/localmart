import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateChatDTO {
  @IsMongoId()
  @IsNotEmpty()
  sellerId: string; // The ID of the seller

  @IsMongoId()
  @IsNotEmpty()
  buyerId: string; // The ID of the buyer

  @IsMongoId()
  @IsNotEmpty()
  listingId: string; // The ID of the listing
}


