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

  // TODO think about using roles!!
/*
  @Prop()
  roles: Role[];
*/
}

export const UserSchema = SchemaFactory.createForClass(User);