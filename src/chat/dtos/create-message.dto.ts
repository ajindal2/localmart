import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDTO {
    @IsMongoId()
    @IsNotEmpty()
    senderId: string; // The ID of the user sending the message

    @IsNotEmpty()
    @IsString()
    content: string; // The content of the message

    @IsOptional()
    sentAt?: Date; // Make sentAt optional
}