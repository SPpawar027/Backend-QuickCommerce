import { ClientSession } from 'mongoose';
import { AppError } from '../../common/errors';
import { IInventory } from '../../common/types';
import {
  inventoryRepository,
  CreateInventoryData,
  UpdateInventoryData,
  InventoryFilters,
} from './inventory.repository';
import { PaginationResult, createPaginationResult } from '../../common/utils/pagination';

export class InventoryService {
  async createInventory(data: CreateInventoryData): Promise<IInventory> {
    // Check if inventory already exists for this product-store combination
    const existing = await inventoryRepository.findByProductAndStore(
      data.productId,
      data.darkStoreId
    );
    if (existing) {
      throw AppError.conflict(
        'Inventory already exists for this product in this store',
        'INVENTORY_EXISTS'
      );
    }

    return inventoryRepository.create(data);
  }

  async getInventoryById(id: string): Promise<IInventory> {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }
    return inventory;
  }

  async getInventoryByProductAndStore(
    productId: string,
    darkStoreId: string
  ): Promise<IInventory> {
    const inventory = await inventoryRepository.findByProductAndStore(productId, darkStoreId);
    if (!inventory) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }
    return inventory;
  }

  async listInventory(
    filters: InventoryFilters,
    page: number,
    limit: number
  ): Promise<PaginationResult<IInventory>> {
    const skip = (page - 1) * limit;
    const { inventory, total } = await inventoryRepository.findAll(filters, skip, limit);

    return createPaginationResult(inventory, total, page, limit);
  }

  async updateInventory(id: string, data: UpdateInventoryData): Promise<IInventory> {
    // Check if inventory exists
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    // Validate that reserved quantity doesn't exceed new quantity
    if (data.quantity !== undefined && data.quantity < existing.reservedQuantity) {
      throw AppError.badRequest(
        'Quantity cannot be less than reserved quantity',
        'INVALID_QUANTITY'
      );
    }

    const updated = await inventoryRepository.update(id, data);
    if (!updated) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    return updated;
  }

  async adjustStock(id: string, quantityChange: number, reason: string): Promise<IInventory> {
    // Check if inventory exists
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    // Validate that stock won't go negative
    if (quantityChange < 0 && existing.quantity + quantityChange < 0) {
      throw AppError.badRequest('Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    // Validate that reserved quantity won't exceed new quantity
    if (
      quantityChange < 0 &&
      existing.quantity + quantityChange < existing.reservedQuantity
    ) {
      throw AppError.badRequest(
        'Cannot reduce stock below reserved quantity',
        'RESERVED_STOCK_CONFLICT'
      );
    }

    const updated = await inventoryRepository.adjustStock(id, quantityChange);
    if (!updated) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    // TODO: Log stock adjustment with reason for audit trail

    return updated;
  }

  async deleteInventory(id: string): Promise<void> {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    // Don't allow deletion if there's reserved stock
    if (inventory.reservedQuantity > 0) {
      throw AppError.badRequest(
        'Cannot delete inventory with reserved stock',
        'RESERVED_STOCK_EXISTS'
      );
    }

    await inventoryRepository.delete(id);
  }

  // Methods for order processing (used by order service)
  async reserveStock(
    productId: string,
    darkStoreId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory> {
    const inventory = await inventoryRepository.findByProductAndStore(productId, darkStoreId);
    if (!inventory) {
      throw AppError.notFound(
        `Inventory not found for product ${productId} in store ${darkStoreId}`,
        'INVENTORY_NOT_FOUND'
      );
    }

    const available = inventory.quantity - inventory.reservedQuantity;
    if (available < quantity) {
      throw AppError.badRequest(
        `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
        'INSUFFICIENT_STOCK'
      );
    }

    const updated = await inventoryRepository.reserveStock(inventory._id, quantity, session);
    if (!updated) {
      throw AppError.badRequest('Failed to reserve stock', 'RESERVE_FAILED');
    }

    return updated;
  }

  async releaseStock(
    productId: string,
    darkStoreId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory> {
    const inventory = await inventoryRepository.findByProductAndStore(productId, darkStoreId);
    if (!inventory) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    const updated = await inventoryRepository.releaseStock(inventory._id, quantity, session);
    if (!updated) {
      throw AppError.badRequest('Failed to release stock', 'RELEASE_FAILED');
    }

    return updated;
  }

  async confirmStockDeduction(
    productId: string,
    darkStoreId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory> {
    const inventory = await inventoryRepository.findByProductAndStore(productId, darkStoreId);
    if (!inventory) {
      throw AppError.notFound('Inventory not found', 'INVENTORY_NOT_FOUND');
    }

    const updated = await inventoryRepository.confirmStockDeduction(
      inventory._id,
      quantity,
      session
    );
    if (!updated) {
      throw AppError.badRequest('Failed to confirm stock deduction', 'CONFIRM_FAILED');
    }

    return updated;
  }

  async checkAvailability(
    productId: string,
    darkStoreId: string,
    quantity: number
  ): Promise<boolean> {
    return inventoryRepository.checkAvailability(productId, darkStoreId, quantity);
  }

  async getAvailableQuantity(productId: string, darkStoreId: string): Promise<number> {
    return inventoryRepository.getAvailableQuantity(productId, darkStoreId);
  }
}

export const inventoryService = new InventoryService();
