import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateSellerDTO {
  @IsMongoId()
  @IsNotEmpty()
  userId: string; // Reference to the User's ObjectId as a string
}
