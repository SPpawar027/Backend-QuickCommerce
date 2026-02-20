import { PaginationResult } from '../types';
export type { PaginationResult } from '../types';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const getPaginationOptions = (
  queryPage?: string,
  queryLimit?: string,
  defaultLimit: number = 10,
  maxLimit: number = 100
): PaginationOptions => {
  const page = Math.max(1, parseInt(queryPage || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(queryLimit || String(defaultLimit), 10))
  );

  return { page, limit };
};

export const getSkipValue = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
