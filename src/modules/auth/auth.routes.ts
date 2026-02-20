import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../common/middleware';
import { authRateLimiter } from '../../common/middleware/rate-limiter';
import { authenticate } from '../users/users.middleware';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schema';

const router = Router();

// Public routes with rate limiting
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema.shape.body),
  authController.register
);
router.post('/login', authRateLimiter, validateBody(loginSchema.shape.body), authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate);

router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authController.getCurrentUser);
router.patch(
  '/change-password',
  validateBody(changePasswordSchema.shape.body),
  authController.changePassword
);

export default router;
