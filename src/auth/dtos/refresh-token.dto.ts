import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDTO {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  refreshToken: string;
}