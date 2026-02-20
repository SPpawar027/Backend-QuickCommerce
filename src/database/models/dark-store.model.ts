import mongoose, { Schema, Model } from 'mongoose';
import { IDarkStore } from '../../common/types';

type DarkStoreModel = Model<IDarkStore>;

const darkStoreSchema = new Schema<IDarkStore, DarkStoreModel>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [200, 'Store name cannot exceed 200 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Invalid coordinates. Format: [longitude, latitude]',
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2dsphere index for geospatial queries
darkStoreSchema.index({ location: '2dsphere' });
darkStoreSchema.index({ isActive: 1 });
darkStoreSchema.index({ email: 1 }, { unique: true });

export const DarkStore = mongoose.model<IDarkStore, DarkStoreModel>('DarkStore', darkStoreSchema);
