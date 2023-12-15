import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types  } from 'mongoose';

export type RatingDocument = HydratedDocument<Rating>;

@Schema()
export class Rating {
    // This is used to distinguis if a given rating is for a seller or a buyer.
    @Prop({ required: true, enum: ['seller', 'buyer'] })
    role: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' })
    listingId: Types.ObjectId; 

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    ratedBy: mongoose.Types.ObjectId; // Reference to the user who gave the rating
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    ratedUser: mongoose.Types.ObjectId; // Reference to the user (seller/buyer) who received the rating

    @Prop({ required: true })
    stars: number; // Number of stars for the rating

    @Prop()
    text: string; // Optional text review

    @Prop({ default: Date.now })
    dateGiven: Date; // Date when the rating was given 
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
