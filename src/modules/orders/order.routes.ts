import { Router } from 'express';
import { orderController } from './order.controller';
import { validateBody, validateParams, validateQuery } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  assignDeliveryPartnerSchema,
  getOrderSchema,
  listOrdersSchema,
  cancelOrderSchema,
} from './order.schema';
import { UserRole } from '../../common/types';

const router = Router();

// Protected routes - Authenticated users
router.use(authenticate);

// Customer routes
router.post('/', validateBody(createOrderSchema.shape.body), orderController.createOrder);
router.get('/my-orders', validateQuery(listOrdersSchema.shape.query), orderController.getMyOrders);
router.get(
  '/:id',
  validateParams(getOrderSchema.shape.params),
  orderController.getOrder
);
router.patch(
  '/:id/cancel',
  validateParams(cancelOrderSchema.shape.params),
  validateBody(cancelOrderSchema.shape.body),
  orderController.cancelOrder
);

// Delivery partner routes
router.get(
  '/delivery/my-assignments',
  validateQuery(listOrdersSchema.shape.query),
  authorize(UserRole.DELIVERY),
  orderController.getDeliveryPartnerOrders
);

// Admin routes
router.use(authorize(UserRole.ADMIN));

router.get('/', validateQuery(listOrdersSchema.shape.query), orderController.listOrders);
router.patch(
  '/:id/status',
  validateParams(updateOrderStatusSchema.shape.params),
  validateBody(updateOrderStatusSchema.shape.body),
  orderController.updateOrderStatus
);
router.patch(
  '/:id/assign',
  validateParams(assignDeliveryPartnerSchema.shape.params),
  validateBody(assignDeliveryPartnerSchema.shape.body),
  orderController.assignDeliveryPartner
);

export default router;
