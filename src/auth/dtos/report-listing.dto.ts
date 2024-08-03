// report-listing.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class ReportListingDTO {
  @IsNotEmpty()
  @IsString()
  listingId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
