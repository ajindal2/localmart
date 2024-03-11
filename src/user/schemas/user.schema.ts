import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {

  @Prop({ required: true, unique: true }) // Required and unique
  userName: string;

  @Prop({ required: true, unique: true }) // Required and unique
  emailAddress: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    default: Date.now, // Sets the default value to the current date and time
    immutable: true,  // Makes the field non-editable after document creation
  })
  date: Date; // Date when the user joined localmart

  @Prop([String])
  pushTokens: string[];

  // TODO think about using roles!!
/*
  @Prop()
  roles: Role[];
*/
}

export const UserSchema = SchemaFactory.createForClass(User);