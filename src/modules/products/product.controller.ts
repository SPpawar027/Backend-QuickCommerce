import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { productService } from './product.service';
import { asyncWrapper, sendSuccess, sendNoContent, sendCreated } from '../../common/utils';
import {
  CreateProductInput,
  UpdateProductInput,
  GetProductParams,
  ListProductsQuery,
} from './product.schema';
import { getPaginationOptions } from '../../common/utils/pagination';
import { SortOrder } from 'mongoose';

export class ProductController {
  createProduct = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const input = req.body as CreateProductInput;
    const product = await productService.createProduct(input);
    sendCreated(res, product, 'Product created successfully');
  });

  getProduct = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetProductParams;
    const product = await productService.getProductById(id);
    sendSuccess(res, product);
  });

  listProducts = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query = req.query as unknown as ListProductsQuery;
    const { page, limit } = getPaginationOptions(query.page, query.limit);

    const filters = {
      category: query.category,
      search: query.search,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      isActive: true,
    };

    const sort = {
      sortBy: query.sortBy,
      sortOrder: (query.sortOrder === 'asc' ? 1 : -1) as SortOrder,
    };

    const result = await productService.listProducts(filters, sort, page, limit);
    sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
  });

  updateProduct = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetProductParams;
    const input = req.body as UpdateProductInput;
    const product = await productService.updateProduct(id, input);
    sendSuccess(res, product, 200, 'Product updated successfully');
  });

  deleteProduct = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetProductParams;
    await productService.deleteProduct(id);
    sendNoContent(res);
  });

  getCategories = asyncWrapper(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const categories = await productService.getCategories();
    sendSuccess(res, categories);
  });
}

export const productController = new ProductController();
