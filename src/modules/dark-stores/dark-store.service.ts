import { AppError } from '../../common/errors';
import { IDarkStore } from '../../common/types';
import {
  darkStoreRepository,
  CreateDarkStoreData,
  UpdateDarkStoreData,
  NearestStoreQuery,
} from './dark-store.repository';
import { PaginationResult, createPaginationResult } from '../../common/utils/pagination';

export class DarkStoreService {
  async createDarkStore(data: CreateDarkStoreData): Promise<IDarkStore> {
    // Check if store with same email exists
    const exists = await darkStoreRepository.existsByEmail(data.email);
    if (exists) {
      throw AppError.conflict('Dark store with this email already exists', 'STORE_EXISTS');
    }

    return darkStoreRepository.create(data);
  }

  async getDarkStoreById(id: string): Promise<IDarkStore> {
    const store = await darkStoreRepository.findById(id);
    if (!store) {
      throw AppError.notFound('Dark store not found', 'STORE_NOT_FOUND');
    }
    return store;
  }

  async listDarkStores(
    isActive: boolean | undefined,
    page: number,
    limit: number
  ): Promise<PaginationResult<IDarkStore>> {
    const skip = (page - 1) * limit;
    const { stores, total } = await darkStoreRepository.findAll(isActive, skip, limit);

    return createPaginationResult(stores, total, page, limit);
  }

  async updateDarkStore(id: string, data: UpdateDarkStoreData): Promise<IDarkStore> {
    // Check if store exists
    const existingStore = await darkStoreRepository.findById(id);
    if (!existingStore) {
      throw AppError.notFound('Dark store not found', 'STORE_NOT_FOUND');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingStore.email) {
      const exists = await darkStoreRepository.existsByEmail(data.email);
      if (exists) {
        throw AppError.conflict('Dark store with this email already exists', 'STORE_EXISTS');
      }
    }

    const updatedStore = await darkStoreRepository.update(id, data);
    if (!updatedStore) {
      throw AppError.notFound('Dark store not found', 'STORE_NOT_FOUND');
    }

    return updatedStore;
  }

  async deleteDarkStore(id: string): Promise<void> {
    const store = await darkStoreRepository.findById(id);
    if (!store) {
      throw AppError.notFound('Dark store not found', 'STORE_NOT_FOUND');
    }

    await darkStoreRepository.delete(id);
  }

  async findNearestStores(query: NearestStoreQuery): Promise<IDarkStore[]> {
    return darkStoreRepository.findNearest(query);
  }

  async toggleStoreActive(id: string): Promise<IDarkStore> {
    const store = await darkStoreRepository.toggleActive(id);
    if (!store) {
      throw AppError.notFound('Dark store not found', 'STORE_NOT_FOUND');
    }
    return store;
  }
}

export const darkStoreService = new DarkStoreService();
