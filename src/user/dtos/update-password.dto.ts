import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDTO {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special character.' })
  newPassword: string;
}
