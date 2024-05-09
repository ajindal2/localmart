import { IsString, IsEmail, MinLength, Matches, Length} from 'class-validator';

export class CreateUserDTO {
  @IsString({ message: 'Display name must be a string' })
  @Length(2, 30, { message: 'Display name must be between 2 and 30 characters' })
  @Matches(/^[A-Za-z][A-Za-z0-9 ]*$/, {
    message: 'Display name must start with a letter and can only contain letters, numbers, and spaces',
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