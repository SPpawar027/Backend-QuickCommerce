import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { validateBody, validateParams, validateQuery } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import {
  createInventorySchema,
  updateInventorySchema,
  adjustStockSchema,
  getInventorySchema,
  getInventoryByProductAndStoreSchema,
  listInventorySchema,
} from './inventory.schema';
import { UserRole } from '../../common/types';

const router = Router();

// Protected routes - Admin only
router.use(authenticate, authorize(UserRole.ADMIN));

router.post(
  '/',
  validateBody(createInventorySchema.shape.body),
  inventoryController.createInventory
);
router.get(
  '/',
  validateQuery(listInventorySchema.shape.query),
  inventoryController.listInventory
);
router.get(
  '/check',
  validateQuery(getInventoryByProductAndStoreSchema.shape.query),
  inventoryController.checkAvailability
);
router.get(
  '/by-product-store',
  validateQuery(getInventoryByProductAndStoreSchema.shape.query),
  inventoryController.getInventoryByProductAndStore
);
router.get(
  '/:id',
  validateParams(getInventorySchema.shape.params),
  inventoryController.getInventory
);
router.patch(
  '/:id',
  validateParams(updateInventorySchema.shape.params),
  validateBody(updateInventorySchema.shape.body),
  inventoryController.updateInventory
);
router.patch(
  '/:id/adjust',
  validateParams(adjustStockSchema.shape.params),
  validateBody(adjustStockSchema.shape.body),
  inventoryController.adjustStock
);
router.delete(
  '/:id',
  validateParams(getInventorySchema.shape.params),
  inventoryController.deleteInventory
);

export default router;
