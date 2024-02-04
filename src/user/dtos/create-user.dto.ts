import { IsString, IsEmail, MinLength, IsOptional, Matches, IsAlphanumeric} from 'class-validator';

export class CreateUserDTO {
  @IsString({ message: 'Username must be a string.' })
  @MinLength(4, { message: 'Username must be at least 4 characters long.' })
  @Matches(/^(?=.*[A-Za-z])[A-Za-z\d]*$/, { message: 'Username must contain at least one letter and can only contain letters and numbers.' })
  userName: string;

  @IsEmail({}, { message: 'Please enter a valid email address.' })
  emailAddress: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special character.' })
  password: string;
}