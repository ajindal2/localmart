import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
import { LocationSchema } from '../../location/schemas/location.schema';

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
    sellerId: Types.ObjectId;

    @Prop({
      required: true,
      enum: ['active', 'delete', 'sold'],
      default: 'active'
    })
    state: string;

    @Prop({ default: Date.now })
    dateCreated: Date; // Date when the listing was created
    
    @Prop({ type: LocationSchema })
    location: typeof LocationSchema;
  }

export const ListingSchema = SchemaFactory.createForClass(Listing);

ListingSchema.index({ title: 'text' });
