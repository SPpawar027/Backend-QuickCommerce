import { Payment } from '../../database/models';
import { IPayment, PaymentStatus } from '../../common/types';
import { ClientSession } from 'mongoose';

export interface CreatePaymentData {
  orderId: string;
  userId: string;
  amount: number;
  method: string;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  transactionId?: string;
  providerResponse?: Record<string, unknown>;
}

export interface PaymentFilters {
  userId?: string;
  status?: PaymentStatus;
  orderId?: string;
}

export class PaymentRepository {
  async findById(id: string): Promise<IPayment | null> {
    return Payment.findById(id);
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ orderId });
  }

  async findAll(
    filters: PaymentFilters,
    skip: number,
    limit: number
  ): Promise<{ payments: IPayment[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.orderId) {
      query.orderId = filters.orderId;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query),
    ]);

    return { payments, total };
  }

  async create(data: CreatePaymentData, session?: ClientSession): Promise<IPayment> {
    const payment = await Payment.create([data], { session });
    return payment[0].toObject();
  }

  async update(id: string, data: UpdatePaymentData, session?: ClientSession): Promise<IPayment | null> {
    const options = session ? { new: true, session } : { new: true };
    return Payment.findByIdAndUpdate(id, data, options);
  }

  async updateByOrderId(
    orderId: string,
    data: UpdatePaymentData,
    session?: ClientSession
  ): Promise<IPayment | null> {
    const options = session ? { new: true, session } : { new: true };
    return Payment.findOneAndUpdate({ orderId }, data, options);
  }

  async existsForOrder(orderId: string): Promise<boolean> {
    const count = await Payment.countDocuments({ orderId });
    return count > 0;
  }

  async getPaymentStats(userId?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (userId) {
      matchStage.userId = userId;
    }

    const stats = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', PaymentStatus.SUCCESS] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', PaymentStatus.FAILED] }, 1, 0] },
          },
          pending: {
            $sum: {
              $cond: [
                { $in: ['$status', [PaymentStatus.PENDING, PaymentStatus.PROCESSING]] },
                1,
                0,
              ],
            },
          },
          totalAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', PaymentStatus.SUCCESS] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        totalAmount: 0,
      }
    );
  }
}

export const paymentRepository = new PaymentRepository();
