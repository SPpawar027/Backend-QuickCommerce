import { z } from 'zod';
import mongoose from 'mongoose';
import { OrderStatus } from '../../common/types';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

const orderItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    deliveryLocation: z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ]),
      address: z.string().min(10, 'Address is required'),
    }),
    notes: z.string().max(500).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const assignDeliveryPartnerSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    deliveryPartnerId: objectIdSchema,
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    status: z.nativeEnum(OrderStatus).optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().min(1).max(500).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type AssignDeliveryPartnerInput = z.infer<typeof assignDeliveryPartnerSchema>['body'];
export type GetOrderParams = z.infer<typeof getOrderSchema>['params'];
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>['query'];
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>['body'];
