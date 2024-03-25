import { IsString, IsEmail, MinLength, IsOptional, Matches, IsAlphanumeric, Length, MaxLength} from 'class-validator';

export class CreateUserDTO {
  @IsString({ message: 'Username must be a string.' })
  @MinLength(4, { message: 'Username must be at least 4 characters long.' })
  @MaxLength(10, { message: 'Username can be maximum 10 characters long.' })
  @Matches(/^(?=.*[A-Za-z])[A-Za-z\d]*$/, { message: 'Username must contain at least one letter and can only contain letters and numbers.' })
  userName: string;

  @IsString({ message: 'Display name must be a string' })
  @Length(2, 30, { message: 'Display name must be between 2 and 30 characters' })
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Display name can only contain letters and spaces',
  })
  displayName: string;
  
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  emailAddress: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special character.' })
  password: string;
}