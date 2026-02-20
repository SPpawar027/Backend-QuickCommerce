import mongoose, { Schema, Model } from 'mongoose';
import { IInventory } from '../../common/types';

type InventoryModel = Model<IInventory>;

const inventorySchema = new Schema<IInventory, InventoryModel>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      ref: 'Product',
    },
    darkStoreId: {
      type: String,
      required: [true, 'Dark store ID is required'],
      ref: 'DarkStore',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique inventory per product-store combination
inventorySchema.index({ productId: 1, darkStoreId: 1 }, { unique: true });
inventorySchema.index({ darkStoreId: 1 });
inventorySchema.index({ productId: 1 });

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function () {
  return this.quantity - this.reservedQuantity;
});

// Pre-save hook to ensure reserved quantity doesn't exceed quantity
inventorySchema.pre('save', function (next) {
  if (this.reservedQuantity > this.quantity) {
    return next(new Error('Reserved quantity cannot exceed total quantity'));
  }
  next();
});

export const Inventory = mongoose.model<IInventory, InventoryModel>('Inventory', inventorySchema);
