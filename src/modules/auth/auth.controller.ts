import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { authService } from './auth.service';
import { asyncWrapper, sendSuccess, sendNoContent } from '../../common/utils';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schema';
import { env } from '../../config/env';

// Cookie options for refresh token
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

// Cookie options for access token (optional, can use Authorization header)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

export class AuthController {
  register = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      201,
      'User registered successfully'
    );
  });

  login = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      200,
      'Login successful'
    );
  });

  refreshToken = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const refreshToken: unknown = req.cookies.refreshToken;
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new Error('Refresh token not found');
    }

    const result = await authService.refreshAccessToken(refreshToken);

    sendSuccess(res, result, 200, 'Token refreshed successfully');
  });

  logout = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    if (userId) {
      await authService.logout(userId);
    }

    // Clear cookies
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.clearCookie('accessToken', { path: '/' });

    sendNoContent(res);
  });

  logoutAll = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    if (!userId) {
      throw new Error('User not found');
    }

    await authService.logoutAll(userId);

    // Clear cookies
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.clearCookie('accessToken', { path: '/' });

    sendNoContent(res);
  });

  changePassword = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    if (!userId) {
      throw new Error('User not found');
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordInput;
    await authService.changePassword(userId, currentPassword, newPassword);

    sendSuccess(res, null, 200, 'Password changed successfully');
  });

  getCurrentUser = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    if (!userId) {
      throw new Error('User not found');
    }

    const user = await authService.getCurrentUser(userId);
    sendSuccess(res, user);
  });
}

export const authController = new AuthController();
