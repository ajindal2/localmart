import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDTO } from './create-userProfile.dto';

export class UpdateUserProfileDTO extends PartialType(CreateUserProfileDTO) {
  // This will inherit all fields from CreateUserProfileDto but make them optional
}