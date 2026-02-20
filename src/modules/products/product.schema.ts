import { z } from 'zod';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    price: z.number().positive('Price must be positive'),
    category: z.string().min(1, 'Category is required'),
    images: z.array(z.string().url('Invalid image URL')).optional().default([]),
    videos: z.array(z.string().url('Invalid video URL')).optional().default([]),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    price: z.number().positive().optional(),
    category: z.string().min(1).optional(),
    images: z.array(z.string().url()).optional(),
    videos: z.array(z.string().url()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.enum(['name', 'price', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type GetProductParams = z.infer<typeof getProductSchema>['params'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
