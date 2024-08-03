import { IsNotEmpty, IsMongoId } from 'class-validator';

export class BlockUserDto {
  @IsNotEmpty()
  @IsMongoId()
  blockerId: string; // The ID of the user who is blocking

  @IsNotEmpty()
  @IsMongoId()
  blockedId: string; // The ID of the user being blocked
}
