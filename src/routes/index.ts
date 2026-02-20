import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { productRoutes } from '../modules/products';
import { darkStoreRoutes } from '../modules/dark-stores';
import { inventoryRoutes } from '../modules/inventory';
import { orderRoutes } from '../modules/orders';
import { paymentRoutes } from '../modules/payments';
import { uploadRoutes } from '../modules/uploads';

const router = Router();

// API v1 routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/dark-stores', darkStoreRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);

export default router;
