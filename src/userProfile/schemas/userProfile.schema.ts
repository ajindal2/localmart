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

    @Prop({
        type: {
          type: String,
          enum: ['Point', 'ZipCode'],
          required: true
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          validate: {
            validator: function(v) {
              return this.location.type === 'Point' ? Array.isArray(v) && v.length === 2 : true;
            },
            message: 'Coordinates must be an array of two numbers'
          }
        },
        postalCode: {
          type: String,
          validate: {
            validator: function(v) {
              return this.location.type === 'ZipCode' ? /^\d{5}(-\d{4})?$/.test(v) : true;
            },
            message: 'Invalid postal code format'
          }
        },
        city: String
      })
      location: {
        type: string;
        coordinates?: number[];
        postalCode?: string;
        city?: string;
      };
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

// Define the conditional index after the schema is created
UserProfileSchema.index(
  { 'location.coordinates': '2dsphere' }, 
  { partialFilterExpression: { 'location.type': 'Point' } }
);
