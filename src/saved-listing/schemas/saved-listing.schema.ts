import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type SavedListingDocument = HydratedDocument<SavedListing>;

@Schema()
export class SavedListing {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: Types.ObjectId; // Reference to the User who saved the listing
  
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' })
    listing: Types.ObjectId; // Reference to the saved Listing
  
    @Prop({ default: Date.now })
    savedOn: Date; // Date when the listing was saved
}

export const SavedListingSchema = SchemaFactory.createForClass(SavedListing);

