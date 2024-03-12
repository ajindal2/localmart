import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {

  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id?: Types.ObjectId;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId; // Reference to the User who is the sender

  @Prop({ required: true })
  content: string; // The content of the message

  @Prop({ default: Date.now })
  sentAt: Date; // Date when the message was sent

  @Prop({ default: false })
  read: boolean; // Indicates if the message has been read
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ senderId: 1 });
