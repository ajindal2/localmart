import { IsString, IsEmail, MinLength, IsOptional, Matches} from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @MinLength(4)
  userName: string;

  @IsEmail()
  emailAddress: string;

  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter.' })
  @Matches(/(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
  password: string;
}