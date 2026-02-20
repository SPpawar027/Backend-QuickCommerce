import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { inventoryService } from './inventory.service';
import { asyncWrapper, sendSuccess, sendNoContent, sendCreated } from '../../common/utils';
import {
  CreateInventoryInput,
  UpdateInventoryInput,
  AdjustStockInput,
  GetInventoryParams,
  GetInventoryByProductAndStoreQuery,
  ListInventoryQuery,
} from './inventory.schema';
import { getPaginationOptions } from '../../common/utils/pagination';

export class InventoryController {
  createInventory = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const input = req.body as CreateInventoryInput;
      const inventory = await inventoryService.createInventory(input);
      sendCreated(res, inventory, 'Inventory created successfully');
    }
  );

  getInventory = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetInventoryParams;
    const inventory = await inventoryService.getInventoryById(id);
    sendSuccess(res, inventory);
  });

  getInventoryByProductAndStore = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const query = req.query as unknown as GetInventoryByProductAndStoreQuery;
      const inventory = await inventoryService.getInventoryByProductAndStore(
        query.productId,
        query.darkStoreId
      );
      sendSuccess(res, inventory);
    }
  );

  listInventory = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const query = req.query as unknown as ListInventoryQuery;
      const { page, limit } = getPaginationOptions(query.page, query.limit);

      const filters = {
        darkStoreId: query.darkStoreId,
        productId: query.productId,
        lowStock: query.lowStock ? parseInt(query.lowStock, 10) : undefined,
      };

      const result = await inventoryService.listInventory(filters, page, limit);
      sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
    }
  );

  updateInventory = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetInventoryParams;
      const input = req.body as UpdateInventoryInput;
      const inventory = await inventoryService.updateInventory(id, input);
      sendSuccess(res, inventory, 200, 'Inventory updated successfully');
    }
  );

  adjustStock = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetInventoryParams;
    const { quantity, reason } = req.body as AdjustStockInput;
    const inventory = await inventoryService.adjustStock(id, quantity, reason);
    sendSuccess(res, inventory, 200, 'Stock adjusted successfully');
  });

  deleteInventory = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetInventoryParams;
      await inventoryService.deleteInventory(id);
      sendNoContent(res);
    }
  );

  checkAvailability = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const query = req.query as unknown as GetInventoryByProductAndStoreQuery;
      const quantity = req.query.quantity ? parseInt(req.query.quantity as string, 10) : 1;

      const isAvailable = await inventoryService.checkAvailability(
        query.productId,
        query.darkStoreId,
        quantity
      );

      const availableQuantity = await inventoryService.getAvailableQuantity(
        query.productId,
        query.darkStoreId
      );

      sendSuccess(res, {
        isAvailable,
        requestedQuantity: quantity,
        availableQuantity,
      });
    }
  );
}

export const inventoryController = new InventoryController();
