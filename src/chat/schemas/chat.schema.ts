import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
import { Message, MessageSchema } from './message.schema';
import { User } from 'src/user/schemas/user.schema';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId; // Reference to the User who is the seller

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId; // Reference to the User who is the buyer

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true })
  listingId: Types.ObjectId; // Reference to the Listing

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[]; // Array of messages

  @Prop({ required: false })
  isSystemMessage: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ sellerId: 1, buyerId: 1, listingId: 1 });
