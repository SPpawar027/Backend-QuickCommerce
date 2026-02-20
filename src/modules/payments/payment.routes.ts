import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validateBody, validateParams, validateQuery } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import {
  createPaymentSchema,
  processPaymentSchema,
  getPaymentSchema,
  getPaymentByOrderSchema,
  listPaymentsSchema,
} from './payment.schema';
import { UserRole } from '../../common/types';
import { asyncWrapper } from '../../common/utils';

const router = Router();

// Webhook endpoint (public, with signature verification)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(asyncWrapper(authenticate));

// Customer routes
router.post('/', validateBody(createPaymentSchema.shape.body), paymentController.createPayment);
router.get(
  '/my-payments',
  validateQuery(listPaymentsSchema.shape.query),
  paymentController.getMyPayments
);
router.get('/stats', paymentController.getPaymentStats);
router.get(
  '/by-order/:orderId',
  validateParams(getPaymentByOrderSchema.shape.params),
  paymentController.getPaymentByOrder
);
router.get('/:id', validateParams(getPaymentSchema.shape.params), paymentController.getPayment);

// Admin routes
router.use(authorize(UserRole.ADMIN));

router.get('/', validateQuery(listPaymentsSchema.shape.query), paymentController.listPayments);
router.post(
  '/:id/process',
  validateParams(processPaymentSchema.shape.params),
  validateBody(processPaymentSchema.shape.body),
  paymentController.processPayment
);
router.post(
  '/:id/refund',
  validateParams(getPaymentSchema.shape.params),
  paymentController.refundPayment
);

export default router;
