import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const createInventorySchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    darkStoreId: objectIdSchema,
    quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    reservedQuantity: z.number().int().min(0).optional().default(0),
  }),
});

export const updateInventorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    quantity: z.number().int().min(0).optional(),
    reservedQuantity: z.number().int().min(0).optional(),
  }),
});

export const adjustStockSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    quantity: z.number().int(), // Can be positive or negative
    reason: z.string().min(1, 'Reason is required').max(200),
  }),
});

export const getInventorySchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getInventoryByProductAndStoreSchema = z.object({
  query: z.object({
    productId: objectIdSchema,
    darkStoreId: objectIdSchema,
  }),
});

export const listInventorySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    darkStoreId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
    lowStock: z.string().optional(), // Filter items with quantity < threshold
  }),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>['body'];
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>['body'];
export type AdjustStockInput = z.infer<typeof adjustStockSchema>['body'];
export type GetInventoryParams = z.infer<typeof getInventorySchema>['params'];
export type GetInventoryByProductAndStoreQuery = z.infer<
  typeof getInventoryByProductAndStoreSchema
>['query'];
export type ListInventoryQuery = z.infer<typeof listInventorySchema>['query'];
