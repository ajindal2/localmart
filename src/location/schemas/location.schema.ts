import * as mongoose from 'mongoose';

const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function (v) {
        return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
      },
      message: 'Invalid longitude and latitude values'
    }
  }
});

export const LocationSchema = new mongoose.Schema({
  coordinates: {
    type: PointSchema,
    required: false // Not required initially as it might be populated later
  },
  city: { type: String, required: false },
  state: { type: String, required: false }, 
  postalCode: { type: String, required: false, 
    validate: {
      validator: function(v) {
        return /^\d{5}(-\d{4})?$/.test(v);
      },
      message: 'Invalid postal code format'
    } 
  },
  formatted_address: { type: String, required: false } 
});

LocationSchema.index({ 'coordinates': '2dsphere' });
