import { Router } from 'express';
import { darkStoreController } from './dark-store.controller';
import { validateBody, validateParams, validateQuery } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import {
  createDarkStoreSchema,
  updateDarkStoreSchema,
  getDarkStoreSchema,
  findNearestSchema,
  listDarkStoresSchema,
} from './dark-store.schema';
import { UserRole } from '../../common/types';

const router = Router();

// Public routes
router.get(
  '/nearest',
  validateQuery(findNearestSchema.shape.query),
  darkStoreController.findNearest
);
router.get(
  '/',
  validateQuery(listDarkStoresSchema.shape.query),
  darkStoreController.listDarkStores
);
router.get(
  '/:id',
  validateParams(getDarkStoreSchema.shape.params),
  darkStoreController.getDarkStore
);

// Protected admin routes
router.use(authenticate, authorize(UserRole.ADMIN));

router.post(
  '/',
  validateBody(createDarkStoreSchema.shape.body),
  darkStoreController.createDarkStore
);
router.patch(
  '/:id',
  validateParams(updateDarkStoreSchema.shape.params),
  validateBody(updateDarkStoreSchema.shape.body),
  darkStoreController.updateDarkStore
);
router.delete(
  '/:id',
  validateParams(getDarkStoreSchema.shape.params),
  darkStoreController.deleteDarkStore
);
router.patch(
  '/:id/toggle',
  validateParams(getDarkStoreSchema.shape.params),
  darkStoreController.toggleActive
);

export default router;
