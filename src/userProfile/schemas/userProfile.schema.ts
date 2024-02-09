import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
import { LocationSchema } from '../../location/schemas/location.schema';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema()
export class UserProfile {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId; // Reference to the User schema for authentication details
  
    @Prop()
    profilePicture: string;

    @Prop() // Optional
    aboutMe: string;

    @Prop({ type: LocationSchema })
    location: typeof LocationSchema;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

