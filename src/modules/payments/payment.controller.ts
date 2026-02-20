import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { paymentService } from './payment.service';
import { asyncWrapper, sendSuccess, sendCreated } from '../../common/utils';
import {
  CreatePaymentInput,
  ProcessPaymentInput,
  GetPaymentParams,
  GetPaymentByOrderParams,
  ListPaymentsQuery,
  WebhookInput,
} from './payment.schema';
import { getPaginationOptions } from '../../common/utils/pagination';

export class PaymentController {
  createPayment = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const input = req.body as CreatePaymentInput;
    const payment = await paymentService.createPayment(userId, input.orderId, input.method);
    sendCreated(res, payment, 'Payment initiated successfully');
  });

  processPayment = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetPaymentParams;
    const { success } = req.body as ProcessPaymentInput;

    const result = await paymentService.processPayment(id, success);
    sendSuccess(
      res,
      {
        payment: result.payment,
        providerResponse: result.providerResponse,
      },
      200,
      result.providerResponse.success ? 'Payment successful' : 'Payment failed'
    );
  });

  getPayment = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetPaymentParams;
    const payment = await paymentService.getPaymentById(id);
    sendSuccess(res, payment);
  });

  getPaymentByOrder = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { orderId } = req.params as unknown as GetPaymentByOrderParams;
      const payment = await paymentService.getPaymentByOrderId(orderId);
      sendSuccess(res, payment);
    }
  );

  listPayments = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query = req.query as unknown as ListPaymentsQuery;
    const { page, limit } = getPaginationOptions(query.page, query.limit);

    const filters = {
      status: query.status,
    };

    const result = await paymentService.listPayments(filters, page, limit);
    sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
  });

  getMyPayments = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const query = req.query as unknown as ListPaymentsQuery;
    const { page, limit } = getPaginationOptions(query.page, query.limit);

    const filters = {
      userId,
      status: query.status,
    };

    const result = await paymentService.listPayments(filters, page, limit);
    sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
  });

  handleWebhook = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    await paymentService.handleWebhook(req.body, signature);
    sendSuccess(res, null, 200, 'Webhook processed successfully');
  });

  getPaymentStats = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const userId = req.user?.role === 'ADMIN' ? undefined : req.user?._id;
      const stats = await paymentService.getPaymentStats(userId);
      sendSuccess(res, stats);
    }
  );

  refundPayment = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetPaymentParams;
    const { reason } = req.body as { reason?: string };

    const payment = await paymentService.refundPayment(id, reason);
    sendSuccess(res, payment, 200, 'Payment refunded successfully');
  });
}

export const paymentController = new PaymentController();
