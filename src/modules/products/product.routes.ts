import { Router } from 'express';
import { productController } from './product.controller';
import { validateBody, validateParams, validateQuery } from '../../common/middleware';
import { authenticate, authorize } from '../users/users.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
} from './product.schema';
import { UserRole } from '../../common/types';

const router = Router();

// Public routes
router.get('/', validateQuery(listProductsSchema.shape.query), productController.listProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', validateParams(getProductSchema.shape.params), productController.getProduct);

// Protected admin routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate, authorize(UserRole.ADMIN));

router.post('/', validateBody(createProductSchema.shape.body), productController.createProduct);
router.patch(
  '/:id',
  validateParams(updateProductSchema.shape.params),
  validateBody(updateProductSchema.shape.body),
  productController.updateProduct
);
router.delete(
  '/:id',
  validateParams(getProductSchema.shape.params),
  productController.deleteProduct
);

export default router;
