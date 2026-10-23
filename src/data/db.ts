import Dexie, { type Table } from 'dexie';
import { Product, StockMovement, ShopSettings } from '@/domain/types';
import { DukanInvoice, SavedProject } from '@/features/hustle/types';

export class MeriDukaanDatabase extends Dexie {
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  settings!: Table<ShopSettings, string>;
  invoices!: Table<DukanInvoice, string>;
  savedProjects!: Table<SavedProject, string>;

  constructor(databaseName: string = 'MeriDukaanDB') {
    super(databaseName);

    // Schema Version 1
    this.version(1).stores({
      products: 'id, name, category, stockQty, archived, createdAt, updatedAt',
      stockMovements: 'id, productId, type, timestamp, operationId',
      settings: 'id',
    });

    // Schema Version 2: Hustle AI Invoices and Saved Projects
    this.version(2).stores({
      products: 'id, name, category, stockQty, archived, createdAt, updatedAt',
      stockMovements: 'id, productId, type, timestamp, operationId',
      settings: 'id',
      invoices: 'id, invoiceNumber, issueDate, customerName, status, createdAt',
      savedProjects: 'id, toolType, title, isFavorite, createdAt',
    });
  }
}

// Global default database instance for runtime
export const db = new MeriDukaanDatabase();

