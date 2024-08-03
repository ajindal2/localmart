import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlockUserDocument = HydratedDocument<BlockUser>;

@Schema()
export class BlockUser {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  blockerId: Types.ObjectId; // User who blocks

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  blockedId: Types.ObjectId; // User being blocked

  @Prop({ default: Date.now })
  createdAt: Date; // Timestamp for when the block was created
}

export const BlockUserSchema = SchemaFactory.createForClass(BlockUser);
