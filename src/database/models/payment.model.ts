import mongoose, { Schema, Model } from 'mongoose';
import { IPayment, PaymentStatus, PaymentMethod } from '../../common/types';

type PaymentModel = Model<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModel>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      ref: 'Order',
      unique: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    providerResponse: {
      type: Schema.Types.Mixed,
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
// `orderId` already has `unique: true` at field level, so no extra index declaration needed.
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment, PaymentModel>('Payment', paymentSchema);
