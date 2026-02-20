import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const createDarkStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    address: z.string().min(10, 'Address must be at least 10 characters').max(500),
    location: z.object({
      type: z.literal('Point'),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ]),
    }),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    email: z.string().email('Invalid email address'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateDarkStoreSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    address: z.string().min(10).max(500).optional(),
    location: z
      .object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
      })
      .optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getDarkStoreSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const findNearestSchema = z.object({
  query: z.object({
    longitude: z.string().transform((val) => parseFloat(val)),
    latitude: z.string().transform((val) => parseFloat(val)),
    maxDistance: z.string().optional().default('10000').transform((val) => parseInt(val, 10)), // Default 10km in meters
  }),
});

export const listDarkStoresSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    isActive: z.string().optional(),
  }),
});

export type CreateDarkStoreInput = z.infer<typeof createDarkStoreSchema>['body'];
export type UpdateDarkStoreInput = z.infer<typeof updateDarkStoreSchema>['body'];
export type GetDarkStoreParams = z.infer<typeof getDarkStoreSchema>['params'];
export type FindNearestQuery = z.infer<typeof findNearestSchema>['query'];
export type ListDarkStoresQuery = z.infer<typeof listDarkStoresSchema>['query'];
