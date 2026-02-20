import { Product } from '../../database/models';
import { IProduct } from '../../common/types';
import { FilterQuery, SortOrder } from 'mongoose';

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  videos?: string[];
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
  videos?: string[];
  isActive?: boolean;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface ProductSort {
  sortBy: string;
  sortOrder: SortOrder;
}

export class ProductRepository {
  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id);
  }

  async findAll(
    filters: ProductFilters,
    sort: ProductSort,
    skip: number,
    limit: number
  ): Promise<{ products: IProduct[]; total: number }> {
    const query: FilterQuery<IProduct> = { deletedAt: null };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const sortOption: Record<string, SortOrder> = {
      [sort.sortBy]: sort.sortOrder,
    };

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    return { products, total };
  }

  async create(data: CreateProductData): Promise<IProduct> {
    const product = await Product.create(data);
    return product.toObject();
  }

  async update(id: string, data: UpdateProductData): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true });
  }

  async hardDelete(id: string): Promise<IProduct | null> {
    return Product.findByIdAndDelete(id);
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await Product.countDocuments({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null,
    });
    return count > 0;
  }

  async getCategories(): Promise<string[]> {
    return Product.distinct('category', { deletedAt: null, isActive: true });
  }
}

export const productRepository = new ProductRepository();
