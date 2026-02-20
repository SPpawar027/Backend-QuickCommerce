import mongoose from 'mongoose';
import { AppError } from '../../common/errors';
import { IOrder, IOrderItem, OrderStatus } from '../../common/types';
import { orderRepository, CreateOrderData, UpdateOrderData, OrderFilters } from './order.repository';
import { productRepository } from '../products/product.repository';
import { darkStoreRepository } from '../dark-stores/dark-store.repository';
import { inventoryService } from '../inventory/inventory.service';
import { PaginationResult, createPaginationResult } from '../../common/utils/pagination';
import { logger } from '../../common/utils/logger';

// Valid status transitions
const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export class OrderService {
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const allowedTransitions = validStatusTransitions[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  async createOrder(userId: string, items: { productId: string; quantity: number }[], deliveryLocation: { type: 'Point'; coordinates: [number, number]; address: string }, notes?: string): Promise<IOrder> {
    // Validate items
    if (!items || items.length === 0) {
      throw AppError.badRequest('Order must have at least one item', 'EMPTY_ORDER');
    }

    // Start a session for the transaction
    const session = await mongoose.startSession();

    try {
      // Use withTransaction for automatic commit/rollback
      const order = await session.withTransaction(async () => {
        // Find nearest dark store
        const nearestStores = await darkStoreRepository.findNearest({
          longitude: deliveryLocation.coordinates[0],
          latitude: deliveryLocation.coordinates[1],
          maxDistance: 15000, // 15km radius
        });

        if (nearestStores.length === 0) {
          throw AppError.badRequest(
            'No dark store available for your location',
            'NO_STORE_AVAILABLE'
          );
        }

        // Select the first (nearest) store
        const darkStore = nearestStores[0];

        // Prepare order items with product details
        const orderItems: IOrderItem[] = [];

        // Check stock availability and reserve for each item
        for (const item of items) {
          // Get product details
          const product = await productRepository.findById(item.productId);
          if (!product) {
            throw AppError.notFound(
              `Product not found: ${item.productId}`,
              'PRODUCT_NOT_FOUND'
            );
          }

          if (!product.isActive) {
            throw AppError.badRequest(
              `Product is not available: ${product.name}`,
              'PRODUCT_NOT_AVAILABLE'
            );
          }

          // Check and reserve stock
          await inventoryService.reserveStock(
            item.productId,
            darkStore._id,
            item.quantity,
            session
          );

          // Add to order items
          orderItems.push({
            productId: item.productId,
            name: product.name,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          });
        }

        // Calculate total amount
        const totalAmount = orderItems.reduce(
          (total, item) => total + item.priceAtPurchase * item.quantity,
          0
        );

        // Create order
        const orderData: CreateOrderData = {
          userId,
          items: orderItems,
          totalAmount,
          darkStoreId: darkStore._id,
          deliveryLocation,
          notes,
        };

        const order = await orderRepository.create(orderData, session);

        logger.info(`Order created: ${order._id} for user: ${userId}`);

        return order;
      });

      return order;
    } catch (error) {
      logger.error('Order creation failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getOrderById(id: string, userId?: string): Promise<IOrder> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // If userId is provided, verify order belongs to user (unless admin)
    if (userId && order.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order', 'ACCESS_DENIED');
    }

    return order;
  }

  async listOrders(filters: OrderFilters, page: number, limit: number): Promise<PaginationResult<IOrder>> {
    const skip = (page - 1) * limit;
    const { orders, total } = await orderRepository.findAll(filters, skip, limit);

    return createPaginationResult(orders, total, page, limit);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy?: string
  ): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, newStatus)) {
      throw AppError.badRequest(
        `Cannot transition from ${order.status} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const session = await mongoose.startSession();

    try {
      const updatedOrder = await session.withTransaction(async () => {
        const updateData: UpdateOrderData = { status: newStatus };

        // Handle specific status transitions
        if (newStatus === OrderStatus.DELIVERED) {
          updateData.actualDeliveryTime = new Date();

          // Confirm stock deduction for all items
          for (const item of order.items) {
            await inventoryService.confirmStockDeduction(
              item.productId,
              order.darkStoreId,
              item.quantity,
              session
            );
          }
        } else if (newStatus === OrderStatus.CANCELLED) {
          // Release reserved stock for all items
          for (const item of order.items) {
            await inventoryService.releaseStock(
              item.productId,
              order.darkStoreId,
              item.quantity,
              session
            );
          }
        } else if (newStatus === OrderStatus.CONFIRMED) {
          // Set estimated delivery time (e.g., 30 minutes from now)
          updateData.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);
        }

        const updated = await orderRepository.update(orderId, updateData, session);
        if (!updated) {
          throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
        }

        logger.info(`Order ${orderId} status updated to ${newStatus} by ${updatedBy || 'system'}`);

        return updated;
      });

      return updatedOrder;
    } catch (error) {
      logger.error('Order status update failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async assignDeliveryPartner(orderId: string, deliveryPartnerId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Only allow assignment for orders in PLACED or CONFIRMED status
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
      throw AppError.badRequest(
        'Cannot assign delivery partner to this order',
        'INVALID_ORDER_STATUS'
      );
    }

    const updatedOrder = await orderRepository.update(orderId, { deliveryPartnerId });
    if (!updatedOrder) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    logger.info(`Delivery partner ${deliveryPartnerId} assigned to order ${orderId}`);

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order', 'ACCESS_DENIED');
    }

    // Check if order can be cancelled
    const cancellableStatuses = [
      OrderStatus.PLACED,
      OrderStatus.CONFIRMED,
      OrderStatus.PACKED,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw AppError.badRequest('Order cannot be cancelled', 'ORDER_NOT_CANCELLABLE');
    }

    const session = await mongoose.startSession();

    try {
      const cancelledOrder = await session.withTransaction(async () => {
        // Release reserved stock
        for (const item of order.items) {
          await inventoryService.releaseStock(
            item.productId,
            order.darkStoreId,
            item.quantity,
            session
          );
        }

        const updateData: UpdateOrderData = {
          status: OrderStatus.CANCELLED,
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
        };

        const updated = await orderRepository.update(orderId, updateData, session);
        if (!updated) {
          throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
        }

        logger.info(`Order ${orderId} cancelled by user ${userId}`);

        return updated;
      });

      return cancelledOrder;
    } catch (error) {
      logger.error('Order cancellation failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserOrders(userId: string, page: number, limit: number): Promise<PaginationResult<IOrder>> {
    return this.listOrders({ userId }, page, limit);
  }

  async getDeliveryPartnerOrders(
    deliveryPartnerId: string,
    status?: OrderStatus
  ): Promise<IOrder[]> {
    return orderRepository.findByDeliveryPartner(deliveryPartnerId, status);
  }
}

export const orderService = new OrderService();
