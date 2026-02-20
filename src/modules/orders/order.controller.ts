import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { orderService } from './order.service';
import { asyncWrapper, sendSuccess, sendCreated } from '../../common/utils';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  AssignDeliveryPartnerInput,
  GetOrderParams,
  ListOrdersQuery,
  CancelOrderInput,
} from './order.schema';
import { getPaginationOptions } from '../../common/utils/pagination';

export class OrderController {
  createOrder = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const input = req.body as CreateOrderInput;
    const order = await orderService.createOrder(
      userId,
      input.items,
      input.deliveryLocation,
      input.notes
    );
    sendCreated(res, order, 'Order created successfully');
  });

  getOrder = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetOrderParams;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Admin and delivery partners can access any order
    const order =
      userRole === 'ADMIN' || userRole === 'DELIVERY'
        ? await orderService.getOrderById(id)
        : await orderService.getOrderById(id, userId);

    sendSuccess(res, order);
  });

  listOrders = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query = req.query as unknown as ListOrdersQuery;
    const { page, limit } = getPaginationOptions(query.page, query.limit);

    const filters = {
      status: query.status,
    };

    const result = await orderService.listOrders(filters, page, limit);
    sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
  });

  getMyOrders = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const query = req.query as unknown as ListOrdersQuery;
    const { page, limit } = getPaginationOptions(query.page, query.limit);

    const result = await orderService.getUserOrders(userId, page, limit);
    sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
  });

  updateOrderStatus = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetOrderParams;
      const { status } = req.body as UpdateOrderStatusInput;
      const updatedBy = req.user?._id;

      const order = await orderService.updateOrderStatus(id, status, updatedBy);
      sendSuccess(res, order, 200, 'Order status updated successfully');
    }
  );

  assignDeliveryPartner = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetOrderParams;
      const { deliveryPartnerId } = req.body as AssignDeliveryPartnerInput;

      const order = await orderService.assignDeliveryPartner(id, deliveryPartnerId);
      sendSuccess(res, order, 200, 'Delivery partner assigned successfully');
    }
  );

  cancelOrder = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetOrderParams;
    const userId = req.user?._id;
    const { reason } = req.body as CancelOrderInput;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const order = await orderService.cancelOrder(id, userId, reason);
    sendSuccess(res, order, 200, 'Order cancelled successfully');
  });

  getDeliveryPartnerOrders = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const deliveryPartnerId = req.user?._id;
      if (!deliveryPartnerId) {
        throw new Error('User not authenticated');
      }

      const query = req.query as unknown as ListOrdersQuery;
      const orders = await orderService.getDeliveryPartnerOrders(deliveryPartnerId, query.status);
      sendSuccess(res, orders);
    }
  );
}

export const orderController = new OrderController();
