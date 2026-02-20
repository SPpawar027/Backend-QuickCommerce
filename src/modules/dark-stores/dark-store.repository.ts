import { DarkStore } from '../../database/models';
import { IDarkStore } from '../../common/types';

export interface CreateDarkStoreData {
  name: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone: string;
  email: string;
  isActive?: boolean;
}

export interface UpdateDarkStoreData {
  name?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface NearestStoreQuery {
  longitude: number;
  latitude: number;
  maxDistance: number; // in meters
}

export class DarkStoreRepository {
  async findById(id: string): Promise<IDarkStore | null> {
    return DarkStore.findById(id);
  }

  async findAll(
    isActive: boolean | undefined,
    skip: number,
    limit: number
  ): Promise<{ stores: IDarkStore[]; total: number }> {
    const query: { isActive?: boolean } = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [stores, total] = await Promise.all([
      DarkStore.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DarkStore.countDocuments(query),
    ]);

    return { stores, total };
  }

  async create(data: CreateDarkStoreData): Promise<IDarkStore> {
    const store = await DarkStore.create(data);
    return store.toObject();
  }

  async update(id: string, data: UpdateDarkStoreData): Promise<IDarkStore | null> {
    return DarkStore.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IDarkStore | null> {
    return DarkStore.findByIdAndDelete(id);
  }

  async findNearest({
    longitude,
    latitude,
    maxDistance,
  }: NearestStoreQuery): Promise<IDarkStore[]> {
    return DarkStore.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
      isActive: true,
    }).limit(5);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await DarkStore.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async toggleActive(id: string): Promise<IDarkStore | null> {
    const store = await DarkStore.findById(id);
    if (!store) return null;

    return DarkStore.findByIdAndUpdate(id, { isActive: !store.isActive }, { new: true });
  }
}

export const darkStoreRepository = new DarkStoreRepository();
