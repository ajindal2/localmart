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
  
   // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Seller' })
    //seller: Types.ObjectId; // Reference to the Seller schema

    // Image
    @Prop({ required: true })
    listingImageUrl: string; // URL to the image
    
    // State: active, archive, sold
    // Location: User should be able to give a location  (zip code or get my location) to every listing. By default, its the location in userprofile.
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
