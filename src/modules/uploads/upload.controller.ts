import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { uploadService } from './upload.service';
import { asyncWrapper, sendSuccess, sendCreated } from '../../common/utils';
import { UploadImageInput, DeleteFileInput } from './upload.schema';
import fs from 'fs';
import { logger } from '../../common/utils/logger';

export class UploadController {
  uploadImage = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw new Error('No image file provided');
    }

    const { folder } = req.body as UploadImageInput;
    const filePath = req.file.path;

    try {
      const result = await uploadService.uploadImage(filePath, folder);

      // Delete local file after upload
      fs.unlink(filePath, err => {
        if (err) {
          logger.error('Failed to delete local file:', err);
        }
      });

      sendCreated(res, result, 'Image uploaded successfully');
    } catch (error) {
      // Clean up local file on error
      fs.unlink(filePath, () => {});
      throw error;
    }
  });

  uploadVideo = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw new Error('No video file provided');
    }

    const { folder } = req.body as UploadImageInput;
    const filePath = req.file.path;

    try {
      const result = await uploadService.uploadVideo(filePath, folder);

      // Delete local file after upload
      fs.unlink(filePath, err => {
        if (err) {
          logger.error('Failed to delete local file:', err);
        }
      });

      sendCreated(res, result, 'Video uploaded successfully');
    } catch (error) {
      // Clean up local file on error
      fs.unlink(filePath, () => {});
      throw error;
    }
  });

  uploadMultipleImages = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new Error('No image files provided');
      }

      const { folder } = req.body as UploadImageInput;
      const files = req.files;

      const uploadPromises = files.map(async file => {
        try {
          const result = await uploadService.uploadImage(file.path, folder);

          // Delete local file after upload
          fs.unlink(file.path, err => {
            if (err) {
              logger.error('Failed to delete local file:', err);
            }
          });

          return result;
        } catch (error) {
          // Clean up local file on error
          fs.unlink(file.path, () => {});
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);

      sendCreated(res, results, 'Images uploaded successfully');
    }
  );

  deleteFile = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { publicId } = req.body as DeleteFileInput;

    await uploadService.deleteFile(publicId);

    sendSuccess(res, null, 200, 'File deleted successfully');
  });

  deleteMultipleFiles = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { publicIds } = req.body as { publicIds: string[] };

      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        throw new Error('No public IDs provided');
      }

      await uploadService.deleteFiles(publicIds);

      sendSuccess(res, null, 200, 'Files deleted successfully');
    }
  );

  generateSignedUrl = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { publicId, options } = req.body as {
        publicId: string;
        options?: Record<string, unknown>;
      };

      const signedUrl = await uploadService.generateSignedUrl(publicId, options);

      sendSuccess(res, { signedUrl });
    }
  );
}

export const uploadController = new UploadController();
