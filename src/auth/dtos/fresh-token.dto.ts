import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDTO {
  @IsString()
  @IsNotEmpty()
  readonly refreshToken: string;
}