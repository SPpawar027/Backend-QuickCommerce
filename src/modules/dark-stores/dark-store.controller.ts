import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { darkStoreService } from './dark-store.service';
import { asyncWrapper, sendSuccess, sendNoContent, sendCreated } from '../../common/utils';
import {
  CreateDarkStoreInput,
  UpdateDarkStoreInput,
  GetDarkStoreParams,
  FindNearestQuery,
  ListDarkStoresQuery,
} from './dark-store.schema';
import { getPaginationOptions } from '../../common/utils/pagination';

export class DarkStoreController {
  createDarkStore = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const input = req.body as CreateDarkStoreInput;
      const store = await darkStoreService.createDarkStore(input);
      sendCreated(res, store, 'Dark store created successfully');
    }
  );

  getDarkStore = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetDarkStoreParams;
    const store = await darkStoreService.getDarkStoreById(id);
    sendSuccess(res, store);
  });

  listDarkStores = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const query = req.query as unknown as ListDarkStoresQuery;
      const { page, limit } = getPaginationOptions(query.page, query.limit);

      const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;

      const result = await darkStoreService.listDarkStores(isActive, page, limit);
      sendSuccess(res, result.data, 200, undefined, { pagination: result.pagination });
    }
  );

  updateDarkStore = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetDarkStoreParams;
      const input = req.body as UpdateDarkStoreInput;
      const store = await darkStoreService.updateDarkStore(id, input);
      sendSuccess(res, store, 200, 'Dark store updated successfully');
    }
  );

  deleteDarkStore = asyncWrapper(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id } = req.params as unknown as GetDarkStoreParams;
      await darkStoreService.deleteDarkStore(id);
      sendNoContent(res);
    }
  );

  findNearest = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const query = req.query as unknown as FindNearestQuery;
    const stores = await darkStoreService.findNearestStores({
      longitude: query.longitude,
      latitude: query.latitude,
      maxDistance: query.maxDistance,
    });
    sendSuccess(res, stores);
  });

  toggleActive = asyncWrapper(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params as unknown as GetDarkStoreParams;
    const store = await darkStoreService.toggleStoreActive(id);
    sendSuccess(res, store, 200, 'Store status toggled successfully');
  });
}

export const darkStoreController = new DarkStoreController();
