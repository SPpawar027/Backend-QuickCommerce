import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadController } from './upload.controller';
import { validateBody } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import { deleteFileSchema } from './upload.schema';
import { UPLOAD_CONFIG } from '../../common/constants';
import { UserRole } from '../../common/types';
import { AppError } from '../../common/errors';
import { asyncWrapper } from '../../common/utils';

const router = Router();

const uploadDir = '/tmp/uploads';

// Create the uploads directory if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images
const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`,
        'INVALID_FILE_TYPE'
      ) as Error
    );
  }
};

// File filter for videos
const videoFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Invalid file type. Allowed types: ${UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES.join(', ')}`,
        'INVALID_FILE_TYPE'
      ) as Error
    );
  }
};

// Configure multer uploads
const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_IMAGE_SIZE,
  },
});

const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_VIDEO_SIZE,
  },
});

const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_IMAGE_SIZE,
    files: 10, // Max 10 images at once
  },
});

// Protected routes - Admin only
router.use(asyncWrapper(authenticate), authorize(UserRole.ADMIN));

// Single image upload
router.post('/image', uploadImage.single('image'), uploadController.uploadImage);

// Multiple images upload
router.post(
  '/images',
  uploadMultipleImages.array('images', 10),
  uploadController.uploadMultipleImages
);

// Video upload
router.post('/video', uploadVideo.single('video'), uploadController.uploadVideo);

// File deletion
router.post('/delete', validateBody(deleteFileSchema.shape.body), uploadController.deleteFile);

router.post('/delete-multiple', uploadController.deleteMultipleFiles);

// Signed URL generation
router.post('/signed-url', uploadController.generateSignedUrl);

export default router;
