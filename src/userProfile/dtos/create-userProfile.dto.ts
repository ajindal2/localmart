import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Types  } from 'mongoose';

export class CreateUserProfileDTO {

  @IsMongoId()
  @IsNotEmpty()
  userId: string; // This should be the user's ObjectId as a string

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  aboutMe?: string;
}