import { Request } from 'express';

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isActive: boolean;
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  videos: string[];
  isActive: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDarkStore {
  _id: string;
  name: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  isActive: boolean;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventory {
  _id: string;
  productId: string;
  darkStoreId: string;
  quantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  darkStoreId: string;
  deliveryPartnerId?: string;
  deliveryLocation: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  paymentId?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  providerResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
