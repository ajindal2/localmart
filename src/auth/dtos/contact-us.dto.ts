import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactUsDTO {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  attachment?: Express.Multer.File; // If there's an attachment
}
