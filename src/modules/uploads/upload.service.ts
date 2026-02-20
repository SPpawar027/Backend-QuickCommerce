/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { cloudinary } from '../../config/cloudinary';
import { AppError } from '../../common/errors';
import { logger } from '../../common/utils/logger';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export class UploadService {
  async uploadImage(
    filePath: string,
    folder: string = 'products',
    options: Record<string, unknown> = {}
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
        ...options,
      });

      logger.info(`Image uploaded: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      };
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const errorMessage = `Failed to upload image. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('Image upload failed:', error);
      throw AppError.internal(errorMessage, 'UPLOAD_FAILED');
    }
  }

  async uploadVideo(
    filePath: string,
    folder: string = 'products',
    options: Record<string, unknown> = {}
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'video',
        chunk_size: 6000000, // 6MB chunks for large videos
        ...options,
      });

      logger.info(`Video uploaded: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      };
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const errorMessage = `Failed to upload video. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error('Video upload failed:', error);
      throw AppError.internal(errorMessage, 'UPLOAD_FAILED');
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await cloudinary.uploader.destroy(publicId);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (result.result !== 'ok') {
        throw new Error(`Failed to delete: ${result.result}`);
      }

      logger.info(`File deleted: ${publicId}`);
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw AppError.internal('Failed to delete file', 'DELETE_FAILED');
    }
  }

  async deleteFiles(publicIds: string[]): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await cloudinary.api.delete_resources(publicIds);

      logger.info(`Files deleted: ${publicIds.join(', ')}`);

      // Check for failed deletions
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const failed = Object.entries(result.deleted || {}).filter(
        ([_, status]) => status !== 'deleted'
      );
      if (failed.length > 0) {
        logger.warn(`Some files failed to delete: ${failed.map(([id]) => id).join(', ')}`);
      }
    } catch (error) {
      logger.error('Batch file deletion failed:', error);
      throw AppError.internal('Failed to delete files', 'DELETE_FAILED');
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async generateSignedUrl(
    publicId: string,
    options: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      const signedUrl = cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        ...options,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Signed URL generation failed:', error);
      throw AppError.internal('Failed to generate signed URL', 'URL_GENERATION_FAILED');
    }
  }

  getPublicIdFromUrl(url: string): string | null {
    try {
      // Extract public ID from Cloudinary URL
      // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

export const uploadService = new UploadService();
