import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';

export type UserPreferencesDocument = HydratedDocument<UserPreferences>;

@Schema()
export class UserPreferences {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop()
    searchDistance: number; // Distance in miles
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);
