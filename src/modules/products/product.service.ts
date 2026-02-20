import { AppError } from '../../common/errors';
import { IProduct } from '../../common/types';
import {
  productRepository,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductSort,
} from './product.repository';
import { PaginationResult, createPaginationResult } from '../../common/utils/pagination';

export class ProductService {
  async createProduct(data: CreateProductData): Promise<IProduct> {
    // Check if product with same name exists
    const exists = await productRepository.existsByName(data.name);
    if (exists) {
      throw AppError.conflict('Product with this name already exists', 'PRODUCT_EXISTS');
    }

    return productRepository.create(data);
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async listProducts(
    filters: ProductFilters,
    sort: ProductSort,
    page: number,
    limit: number
  ): Promise<PaginationResult<IProduct>> {
    const skip = (page - 1) * limit;
    const { products, total } = await productRepository.findAll(filters, sort, skip, limit);

    return createPaginationResult(products, total, page, limit);
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<IProduct> {
    // Check if product exists
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== existingProduct.name) {
      const exists = await productRepository.existsByName(data.name);
      if (exists) {
        throw AppError.conflict('Product with this name already exists', 'PRODUCT_EXISTS');
      }
    }

    const updatedProduct = await productRepository.update(id, data);
    if (!updatedProduct) {
      throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }

    await productRepository.softDelete(id);
  }

  async getCategories(): Promise<string[]> {
    return productRepository.getCategories();
  }
}

export const productService = new ProductService();
