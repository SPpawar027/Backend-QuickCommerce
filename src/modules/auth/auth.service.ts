import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';
import { authRepository, CreateUserData } from './auth.repository';
import { IUser, TokenPayload, UserRole } from '../../common/types';
import { verifyFirebaseIdToken } from '../../config/firebase';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<IUser, 'password' | 'refreshTokenHash'>;
  tokens: AuthTokens;
}

interface FirebaseUserProfile {
  email: string;
  name: string;
  phone?: string;
}

export class AuthService {
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
    });
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private createTokenPayload(user: IUser): TokenPayload {
    return {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
  }

  private sanitizeUser(user: IUser): Omit<IUser, 'password' | 'refreshTokenHash'> {
    const {
      password: _password,
      refreshTokenHash: _refresh,
      ...sanitized
    } = user as IUser & {
      password?: string;
      refreshTokenHash?: string;
    };
    return sanitized;
  }

  private async extractVerifiedFirebaseProfile(idToken: string): Promise<FirebaseUserProfile> {
    const decoded = await verifyFirebaseIdToken(idToken);
    const email = decoded.email?.toLowerCase().trim();

    if (!email) {
      throw AppError.badRequest('Firebase token does not include an email', 'FIREBASE_EMAIL_MISSING');
    }

    if (!decoded.email_verified) {
      throw AppError.unauthorized('Firebase email is not verified', 'FIREBASE_EMAIL_NOT_VERIFIED');
    }

    const displayName = decoded.name?.trim();
    const fallbackName = email.split('@')[0];

    return {
      email,
      name: displayName || fallbackName || 'User',
      phone: typeof decoded.phone_number === 'string' ? decoded.phone_number : undefined,
    };
  }

  async register(data: CreateUserData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await authRepository.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict('User with this email already exists', 'USER_EXISTS');
    }

    // Create user
    const user = await authRepository.create(data);

    // Generate tokens
    const payload = this.createTokenPayload(user);
    const tokens = this.generateTokens(payload);

    // Store refresh token hash
    await authRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user with password
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const payload = this.createTokenPayload(user);
    const tokens = this.generateTokens(payload);

    // Store refresh token hash
    await authRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async loginWithFirebaseIdToken(idToken: string): Promise<AuthResponse> {
    const profile = await this.extractVerifiedFirebaseProfile(idToken);
    const user = await authRepository.findByEmail(profile.email);

    if (!user) {
      throw AppError.notFound(
        'User not registered. Complete Firebase registration first.',
        'USER_NOT_REGISTERED'
      );
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const payload = this.createTokenPayload(user);
    const tokens = this.generateTokens(payload);
    await authRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async registerWithFirebaseIdToken(idToken: string): Promise<AuthResponse> {
    const profile = await this.extractVerifiedFirebaseProfile(idToken);
    const existingUser = await authRepository.findByEmail(profile.email);

    if (existingUser) {
      throw AppError.conflict('User with this email already exists', 'USER_EXISTS');
    }

    const randomPassword = crypto.randomBytes(48).toString('hex');
    const createUserData: CreateUserData = {
      email: profile.email,
      name: profile.name,
      password: randomPassword,
      role: UserRole.CUSTOMER,
      phone: profile.phone,
    };

    const user = await authRepository.create(createUserData);
    const payload = this.createTokenPayload(user);
    const tokens = this.generateTokens(payload);
    await authRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;

      // Verify stored refresh token
      const isValid = await authRepository.verifyRefreshToken(decoded.userId, refreshToken);
      if (!isValid) {
        throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(decoded);

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    // Invalidate refresh token
    await authRepository.updateRefreshToken(userId, null);
  }

  async logoutAll(userId: string): Promise<void> {
    // Invalidate all sessions by clearing refresh token
    await authRepository.updateRefreshToken(userId, null);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify current password
    const isValid = await authRepository.comparePassword(userId, currentPassword);
    if (!isValid) {
      throw AppError.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Update password (hashing is handled by pre-save hook)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await authRepository.update(userId, { password: hashedPassword } as never);
  }

  async getCurrentUser(userId: string): Promise<Omit<IUser, 'password' | 'refreshTokenHash'>> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }
    return this.sanitizeUser(user);
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid access token', 'INVALID_TOKEN');
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
