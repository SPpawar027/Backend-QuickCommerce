import mongoose, { ClientSession } from 'mongoose';
import crypto from 'crypto';
import { AppError } from '../../common/errors';
import { IPayment, PaymentStatus, PaymentMethod } from '../../common/types';
import {
  paymentRepository,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentFilters,
} from './payment.repository';
import { orderRepository } from '../orders/order.repository';
import { PaginationResult, createPaginationResult } from '../../common/utils/pagination';
import { logger } from '../../common/utils/logger';

// Simulated payment provider
interface PaymentProviderResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  providerData: Record<string, unknown>;
}

export class PaymentService {
  private async simulatePaymentProvider(
    amount: number,
    method: string
  ): Promise<PaymentProviderResponse> {
    // Simulate API call to payment provider
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 90% success rate for testing
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN_${crypto.randomBytes(16).toString('hex').toUpperCase()}`,
        message: 'Payment processed successfully',
        providerData: {
          timestamp: new Date().toISOString(),
          method,
          amount,
        },
      };
    } else {
      return {
        success: false,
        message: 'Payment failed: Insufficient funds',
        providerData: {
          timestamp: new Date().toISOString(),
          method,
          amount,
          errorCode: 'INSUFFICIENT_FUNDS',
        },
      };
    }
  }

  private verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  async createPayment(userId: string, orderId: string, method: PaymentMethod): Promise<IPayment> {
    // Check if payment already exists for this order
    const exists = await paymentRepository.existsForOrder(orderId);
    if (exists) {
      throw AppError.conflict('Payment already exists for this order', 'PAYMENT_EXISTS');
    }

    // Get order details
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order', 'ACCESS_DENIED');
    }

    // Create payment record
    const paymentData: CreatePaymentData = {
      orderId,
      userId,
      amount: order.totalAmount,
      method,
    };

    const payment = await paymentRepository.create(paymentData);

    logger.info(`Payment created: ${payment._id} for order: ${orderId}`);

    return payment;
  }

  async processPayment(
    paymentId: string,
    simulateSuccess?: boolean
  ): Promise<{ payment: IPayment; providerResponse: PaymentProviderResponse }> {
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        // Get payment
        const payment = await paymentRepository.findById(paymentId);
        if (!payment) {
          throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // Check if already processed
        if (payment.status !== PaymentStatus.PENDING) {
          throw AppError.badRequest(
            `Payment is already ${payment.status.toLowerCase()}`,
            'PAYMENT_ALREADY_PROCESSED'
          );
        }

        // Update status to processing
        await paymentRepository.update(
          paymentId,
          { status: PaymentStatus.PROCESSING },
          session
        );

        // Call payment provider (simulated)
        const providerResponse = await this.simulatePaymentProvider(
          payment.amount,
          payment.method
        );

        // Override for testing if specified
        if (simulateSuccess !== undefined) {
          providerResponse.success = simulateSuccess;
          if (simulateSuccess && !providerResponse.transactionId) {
            providerResponse.transactionId = `TXN_${crypto
              .randomBytes(16)
              .toString('hex')
              .toUpperCase()}`;
          }
        }

        // Update payment based on provider response
        const updateData: UpdatePaymentData = {
          status: providerResponse.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          providerResponse: providerResponse.providerData,
        };

        if (providerResponse.transactionId) {
          updateData.transactionId = providerResponse.transactionId;
        }

        const updatedPayment = await paymentRepository.update(paymentId, updateData, session);
        if (!updatedPayment) {
          throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        // If payment successful, update order with payment ID
        if (providerResponse.success) {
          await orderRepository.update(
            payment.orderId,
            { paymentId: updatedPayment._id },
            session
          );
        }

        logger.info(
          `Payment ${paymentId} processed: ${providerResponse.success ? 'SUCCESS' : 'FAILED'}`
        );

        return { payment: updatedPayment, providerResponse };
      });

      return result;
    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPaymentById(id: string): Promise<IPayment> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<IPayment> {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
    }
    return payment;
  }

  async listPayments(
    filters: PaymentFilters,
    page: number,
    limit: number
  ): Promise<PaginationResult<IPayment>> {
    const skip = (page - 1) * limit;
    const { payments, total } = await paymentRepository.findAll(filters, skip, limit);

    return createPaginationResult(payments, total, page, limit);
  }

  async handleWebhook(payload: Record<string, unknown>, signature?: string): Promise<void> {
    // Verify webhook signature if provided
    if (signature) {
      const webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
      const payloadString = JSON.stringify(payload);

      if (!this.verifyWebhookSignature(payloadString, signature, webhookSecret)) {
        throw AppError.unauthorized('Invalid webhook signature', 'INVALID_SIGNATURE');
      }
    }

    // Process webhook payload
    const { orderId, status, transactionId } = payload as {
      orderId?: string;
      status?: string;
      transactionId?: string;
    };

    if (!orderId || !status) {
      throw AppError.badRequest('Invalid webhook payload', 'INVALID_PAYLOAD');
    }

    // Map provider status to our status
    let paymentStatus: PaymentStatus;
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        paymentStatus = PaymentStatus.SUCCESS;
        break;
      case 'failed':
      case 'declined':
        paymentStatus = PaymentStatus.FAILED;
        break;
      default:
        paymentStatus = PaymentStatus.PENDING;
    }

    // Update payment
    const updateData: UpdatePaymentData = {
      status: paymentStatus,
      providerResponse: payload,
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await paymentRepository.updateByOrderId(orderId, updateData);

    logger.info(`Webhook processed for order ${orderId}: ${paymentStatus}`);
  }

  async getPaymentStats(userId?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
  }> {
    return paymentRepository.getPaymentStats(userId);
  }

  async refundPayment(paymentId: string, reason?: string): Promise<IPayment> {
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const payment = await paymentRepository.findById(paymentId);
        if (!payment) {
          throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        if (payment.status !== PaymentStatus.SUCCESS) {
          throw AppError.badRequest(
            'Only successful payments can be refunded',
            'PAYMENT_NOT_REFUNDABLE'
          );
        }

        // Simulate refund
        const refundResponse = await this.simulatePaymentProvider(payment.amount, 'REFUND');

        if (!refundResponse.success) {
          throw AppError.internal('Refund failed', 'REFUND_FAILED');
        }

        const updatedPayment = await paymentRepository.update(
          paymentId,
          {
            status: PaymentStatus.REFUNDED,
            providerResponse: {
              ...payment.providerResponse,
              refund: refundResponse.providerData,
              refundReason: reason,
            },
          },
          session
        );

        if (!updatedPayment) {
          throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
        }

        logger.info(`Payment ${paymentId} refunded. Reason: ${reason || 'Not specified'}`);

        return updatedPayment;
      });

      return result;
    } catch (error) {
      logger.error('Refund failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const paymentService = new PaymentService();
