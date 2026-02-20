import { User } from '../../database/models';
import { IUser, UserRole } from '../../common/types';
import bcrypt from 'bcrypt';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  address?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  address?: string;
  refreshTokenHash?: string | null;
}

export class AuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password');
  }

  async create(data: CreateUserData): Promise<IUser> {
    const user = await User.create(data);
    return user.toObject();
  }

  async update(id: string, data: UpdateUserData): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    const hash = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await User.findByIdAndUpdate(id, { refreshTokenHash: hash });
  }

  async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await User.findById(userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) return false;
    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  async comparePassword(userId: string, password: string): Promise<boolean> {
    const user = await User.findById(userId).select('+password');
    if (!user) return false;
    return user.comparePassword(password);
  }
}

export const authRepository = new AuthRepository();
