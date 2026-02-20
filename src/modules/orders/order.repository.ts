import { Order } from '../../database/models';
import { IOrder, IOrderItem, OrderStatus } from '../../common/types';
import { ClientSession } from 'mongoose';

export interface CreateOrderData {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  darkStoreId: string;
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  notes?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  deliveryPartnerId?: string;
  paymentId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  darkStoreId?: string;
  deliveryPartnerId?: string;
}

export class OrderRepository {
  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id);
  }

  async findAll(
    filters: OrderFilters,
    skip: number,
    limit: number
  ): Promise<{ orders: IOrder[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.darkStoreId) {
      query.darkStoreId = filters.darkStoreId;
    }

    if (filters.deliveryPartnerId) {
      query.deliveryPartnerId = filters.deliveryPartnerId;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return { orders, total };
  }

  async create(data: CreateOrderData, session?: ClientSession): Promise<IOrder> {
    const order = await Order.create([data], { session });
    return order[0].toObject();
  }

  async update(id: string, data: UpdateOrderData, session?: ClientSession): Promise<IOrder | null> {
    const options = session ? { new: true, session } : { new: true };
    return Order.findByIdAndUpdate(id, data, options);
  }

  async findByIdAndUpdate(
    id: string,
    data: UpdateOrderData,
    session?: ClientSession
  ): Promise<IOrder | null> {
    const options = session ? { new: true, session } : { new: true };
    return Order.findByIdAndUpdate(id, data, options);
  }

  // Get orders by status for processing
  async findByStatus(status: OrderStatus, limit: number = 100): Promise<IOrder[]> {
    return Order.find({ status }).sort({ createdAt: 1 }).limit(limit).lean();
  }

  // Get orders assigned to delivery partner
  async findByDeliveryPartner(
    deliveryPartnerId: string,
    status?: OrderStatus
  ): Promise<IOrder[]> {
    const query: Record<string, unknown> = { deliveryPartnerId };
    if (status) {
      query.status = status;
    }
    return Order.find(query).sort({ createdAt: -1 }).lean();
  }

  // Get active orders for a user
  async findActiveOrdersByUser(userId: string): Promise<IOrder[]> {
    const inactiveStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];
    return Order.find({
      userId,
      status: { $nin: inactiveStatuses },
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Check if order belongs to user
  async belongsToUser(orderId: string, userId: string): Promise<boolean> {
    const count = await Order.countDocuments({ _id: orderId, userId });
    return count > 0;
  }
}

export const orderRepository = new OrderRepository();
