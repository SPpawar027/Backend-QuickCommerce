import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '../../common/types';

type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModel>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1, deletedAt: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Soft delete query middleware
productSchema.pre(/^find/, function (next) {
  const query = this as mongoose.Query<IProduct[], IProduct>;
  query.where({ deletedAt: null });
  next();
});

export const Product = mongoose.model<IProduct, ProductModel>('Product', productSchema);
