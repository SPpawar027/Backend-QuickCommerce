import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../../common/types';
import { AppError } from '../../common/errors';
import { authService } from '../auth/auth.service';
import { authRepository } from '../auth/auth.repository';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw AppError.unauthorized('Access token is required', 'TOKEN_REQUIRED');
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await authRepository.findById(decoded.userId);
    if (!user) {
      throw AppError.unauthorized('User no longer exists', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required', 'AUTH_REQUIRED');
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(
        'You do not have permission to perform this action',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);
      const user = await authRepository.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Continue without authentication
    next();
  }
};
