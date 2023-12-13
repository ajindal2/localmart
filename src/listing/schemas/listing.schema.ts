import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type ListingDocument = HydratedDocument<Listing>;

@Schema()
export class Listing {
    @Prop({ required: true })
    title: string;
  
    @Prop()
    description: string;
  
    @Prop({ required: true })
    price: number;

    @Prop({
        type: [String],
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length > 0;
          },
          message: props => `${props.value} must be an array with at least one image URL`
        },
        required: true
      })
      imageUrls: string[]; // URLs to the images
    
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Seller' })
    seller: Types.ObjectId;

    @Prop({
      required: true,
      enum: ['active', 'archive', 'sold'],
      default: 'active'
    })
    state: string;
    
    // Location: User should be able to give a location  (zip code or get my location) to every listing. By default, its the location in userprofile.
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
