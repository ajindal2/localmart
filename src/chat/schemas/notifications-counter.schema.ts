import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type NotificationsCounterDocument = HydratedDocument<NotificationsCounter>;

@Schema()
export class NotificationsCounter {

  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id?: Types.ObjectId;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; 

  @Prop({ default: 0 })
  unreadNotificationCount: number;
}

export const NotificationsCounterSchema = SchemaFactory.createForClass(NotificationsCounter);

