import { IsMongoId, IsNotEmpty } from "class-validator";

export class MarkAsReadDto {
    @IsMongoId()
    @IsNotEmpty()
    chatId: string;
  
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
  }