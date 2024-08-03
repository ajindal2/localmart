import { IsNotEmpty, IsMongoId, IsString, IsBoolean } from 'class-validator';

export class ReportUserDto {
  @IsNotEmpty()
  @IsMongoId()
  reporterId: string; // The ID of the user reporting

  @IsNotEmpty()
  @IsMongoId()
  reportedUserId: string; // The ID of the user being reported

  @IsNotEmpty()
  @IsString()
  reason: string; // Reason for reporting the user

  @IsBoolean()
  blockUser: boolean; // Indicates if the reporter wants to block the user
}
