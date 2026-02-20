import { Inventory } from '../../database/models';
import { IInventory } from '../../common/types';
import { ClientSession } from 'mongoose';

export interface CreateInventoryData {
  productId: string;
  darkStoreId: string;
  quantity: number;
  reservedQuantity?: number;
}

export interface UpdateInventoryData {
  quantity?: number;
  reservedQuantity?: number;
}

export interface InventoryFilters {
  darkStoreId?: string;
  productId?: string;
  lowStock?: number;
}

export class InventoryRepository {
  async findById(id: string): Promise<IInventory | null> {
    return Inventory.findById(id);
  }

  async findByProductAndStore(productId: string, darkStoreId: string): Promise<IInventory | null> {
    return Inventory.findOne({ productId, darkStoreId });
  }

  async findAll(
    filters: InventoryFilters,
    skip: number,
    limit: number
  ): Promise<{ inventory: IInventory[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.darkStoreId) {
      query.darkStoreId = filters.darkStoreId;
    }

    if (filters.productId) {
      query.productId = filters.productId;
    }

    if (filters.lowStock !== undefined) {
      query.$expr = { $lt: ['$quantity', filters.lowStock] };
    }

    const [inventory, total] = await Promise.all([
      Inventory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Inventory.countDocuments(query),
    ]);

    return { inventory, total };
  }

  async create(data: CreateInventoryData): Promise<IInventory> {
    const inventory = await Inventory.create(data);
    return inventory.toObject();
  }

  async update(id: string, data: UpdateInventoryData): Promise<IInventory | null> {
    return Inventory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IInventory | null> {
    return Inventory.findByIdAndDelete(id);
  }

  // Atomic stock adjustment with session
  async adjustStock(
    id: string,
    quantityChange: number,
    session?: ClientSession
  ): Promise<IInventory | null> {
    const update: Record<string, unknown> = {};

    if (quantityChange > 0) {
      // Increase stock
      update.$inc = { quantity: quantityChange };
    } else {
      // Decrease stock - ensure we don't go negative
      update.$inc = { quantity: quantityChange };
    }

    const options = session ? { new: true, session } : { new: true };
    return Inventory.findByIdAndUpdate(id, update, options);
  }

  // Reserve stock (for order processing)
  async reserveStock(
    id: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory | null> {
    const query: Record<string, unknown> = { _id: id };

    // Ensure we have enough available stock
    if (session) {
      query.$expr = { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, quantity] };
    }

    const update = { $inc: { reservedQuantity: quantity } };
    const options = session ? { new: true, session } : { new: true };

    return Inventory.findOneAndUpdate(query, update, options);
  }

  // Release reserved stock (order cancelled or failed)
  async releaseStock(
    id: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory | null> {
    const update = { $inc: { reservedQuantity: -quantity } };
    const options = session ? { new: true, session } : { new: true };
    return Inventory.findByIdAndUpdate(id, update, options);
  }

  // Confirm stock deduction (order confirmed)
  async confirmStockDeduction(
    id: string,
    quantity: number,
    session?: ClientSession
  ): Promise<IInventory | null> {
    const update = {
      $inc: {
        quantity: -quantity,
        reservedQuantity: -quantity,
      },
    };
    const options = session ? { new: true, session } : { new: true };
    return Inventory.findByIdAndUpdate(id, update, options);
  }

  // Check if stock is available
  async checkAvailability(productId: string, darkStoreId: string, quantity: number): Promise<boolean> {
    const inventory = await Inventory.findOne({ productId, darkStoreId });
    if (!inventory) return false;

    const available = inventory.quantity - inventory.reservedQuantity;
    return available >= quantity;
  }

  // Get available quantity
  async getAvailableQuantity(productId: string, darkStoreId: string): Promise<number> {
    const inventory = await Inventory.findOne({ productId, darkStoreId });
    if (!inventory) return 0;

    return inventory.quantity - inventory.reservedQuantity;
  }

  // Bulk create/update inventory
  async upsert(data: CreateInventoryData): Promise<IInventory> {
    const filter = { productId: data.productId, darkStoreId: data.darkStoreId };
    const update = { ...data };
    const options = { upsert: true, new: true, runValidators: true };

    const result = await Inventory.findOneAndUpdate(filter, update, options);
    if (!result) {
      throw new Error('Failed to upsert inventory');
    }
    return result;
  }
}

export const inventoryRepository = new InventoryRepository();
