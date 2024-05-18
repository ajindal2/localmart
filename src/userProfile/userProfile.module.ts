import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfileService } from './userProfile.service';
import { UserProfileController } from './userProfile.controller';
import { UserProfile, UserProfileSchema } from './schemas/userProfile.schema';
import { LocationModule } from '../location/location.module';
import { ImageUploadModule } from 'src/image-upload/image-upload.module';
import { CommonModule } from '../common/common.module'; 


@Module({
  imports: [
    CommonModule,
    ImageUploadModule,
    MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
    LocationModule,
  ],
  providers: [UserProfileService],
  controllers: [UserProfileController],
  exports: [UserProfileService] 
})
export class UserProfileModule {}
