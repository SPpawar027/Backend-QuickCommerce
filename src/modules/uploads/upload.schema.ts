import { z } from 'zod';

export const uploadImageSchema = z.object({
  body: z.object({
    folder: z.string().optional().default('products'),
  }),
});

export const uploadVideoSchema = z.object({
  body: z.object({
    folder: z.string().optional().default('products'),
  }),
});

export const deleteFileSchema = z.object({
  body: z.object({
    publicId: z.string().min(1, 'Public ID is required'),
  }),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>['body'];
export type UploadVideoInput = z.infer<typeof uploadVideoSchema>['body'];
export type DeleteFileInput = z.infer<typeof deleteFileSchema>['body'];
