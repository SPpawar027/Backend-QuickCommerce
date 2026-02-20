import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IOrderItem, OrderStatus } from '../../common/types';

type OrderModel = Model<IOrder>;

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      ref: 'Product',
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    priceAtPurchase: {
      type: Number,
      required: [true, 'Price at purchase is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PLACED,
      index: true,
    },
    darkStoreId: {
      type: String,
      required: [true, 'Dark store ID is required'],
      ref: 'DarkStore',
    },
    deliveryPartnerId: {
      type: String,
      ref: 'User',
      default: null,
    },
    deliveryLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: [true, 'Delivery address is required'],
      },
    },
    paymentId: {
      type: String,
      ref: 'Payment',
      default: null,
    },
    estimatedDeliveryTime: {
      type: Date,
      default: null,
    },
    actualDeliveryTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ darkStoreId: 1 });
orderSchema.index({ deliveryPartnerId: 1 });
orderSchema.index({ 'deliveryLocation.coordinates': '2dsphere' });
orderSchema.index({ createdAt: -1 });

// Calculate total amount before saving
orderSchema.pre('save', function (next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce(
      (total, item) => total + item.priceAtPurchase * item.quantity,
      0
    );
  }
  next();
});

export const Order = mongoose.model<IOrder, OrderModel>('Order', orderSchema);
