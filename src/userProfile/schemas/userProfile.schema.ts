import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema()
export class UserProfile {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId; // Reference to the User schema for authentication details
  
    @Prop()
    profilePicture: string;

    @Prop() // Optional
    aboutMe: string;

    // Ratings they gave - think. Mybe there should be a ratings schema having giver and receiver id's and this mapping is not needed.
    // Location
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
