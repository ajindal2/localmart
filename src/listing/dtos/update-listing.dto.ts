import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDTO } from './create-listing.dto';

export class UpdateListingDTO extends PartialType(CreateListingDTO) {
  // Inherits all fields from CreateListingDto but makes them optional
}