import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types  } from 'mongoose';
import { LocationSchema } from 'src/location/schemas/location.schema';

export type SellerDocument = HydratedDocument<Seller>;

@Schema()
export class Seller {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId; // Reference to the User schema
  
    @Prop({ type: LocationSchema })
    location: typeof LocationSchema;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
