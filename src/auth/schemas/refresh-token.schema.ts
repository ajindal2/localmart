
import * as mongoose from 'mongoose';

export const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  refreshToken: String,
  expires: Date,
});

export interface RefreshToken extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  refreshToken: string;
  expires: Date;
}