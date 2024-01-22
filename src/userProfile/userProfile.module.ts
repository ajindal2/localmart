import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfileService } from './userProfile.service';
import { UserProfileController } from './userProfile.controller';
import { UserProfile, UserProfileSchema } from './schemas/userProfile.schema';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
    SharedModule,
  ],
  providers: [UserProfileService],
  controllers: [UserProfileController],
})
export class UserProfileModule {}
