import { z } from 'zod';
import mongoose from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../common/types';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: objectIdSchema,
    method: z.nativeEnum(PaymentMethod),
  }),
});

export const processPaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    success: z.boolean(),
    transactionId: z.string().optional(),
    providerResponse: z.record(z.unknown()).optional(),
  }),
});

export const getPaymentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const getPaymentByOrderSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    status: z.nativeEnum(PaymentStatus).optional(),
  }),
});

export const webhookSchema = z.object({
  body: z.record(z.unknown()),
  headers: z.object({
    'x-webhook-signature': z.string().optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>['body'];
export type GetPaymentParams = z.infer<typeof getPaymentSchema>['params'];
export type GetPaymentByOrderParams = z.infer<typeof getPaymentByOrderSchema>['params'];
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>['query'];
export type WebhookInput = z.infer<typeof webhookSchema>;
