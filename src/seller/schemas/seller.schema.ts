import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types  } from 'mongoose';

export type SellerDocument = HydratedDocument<Seller>;

@Schema()
export class Seller {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: Types.ObjectId; // Reference to the User schema
  
    // PickUp location
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
