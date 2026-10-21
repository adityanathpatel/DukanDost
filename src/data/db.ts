import Dexie, { type Table } from 'dexie';
import { Product, StockMovement, ShopSettings } from '@/domain/types';

export class MeriDukaanDatabase extends Dexie {
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  settings!: Table<ShopSettings, string>;

  constructor(databaseName: string = 'MeriDukaanDB') {
    super(databaseName);

    // Schema Version 1
    this.version(1).stores({
      products: 'id, name, category, stockQty, archived, createdAt, updatedAt',
      stockMovements: 'id, productId, type, timestamp, operationId',
      settings: 'id',
    });
  }
}

// Global default database instance for runtime
export const db = new MeriDukaanDatabase();

