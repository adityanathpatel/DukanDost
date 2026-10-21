import { MeriDukaanDatabase, db as defaultDb } from './db';
import { 
  Product, 
  StockMovement, 
  ProductUnit, 
  CreateProductInput, 
  UpdateProductInput 
} from '@/domain/types';
import { 
  validateQuantity, 
  roundDecimal, 
  convertUnit 
} from '@/domain/units';
import { 
  applySale, 
  applyStockInward 
} from '@/domain/stock';

export function generateId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class ProductRepository {
  private db: MeriDukaanDatabase;

  constructor(databaseInstance: MeriDukaanDatabase = defaultDb) {
    this.db = databaseInstance;
  }

  /**
   * Creates a new product. If initial stockQty > 0, records an opening_stock
   * movement in the same atomic transaction.
   */
  async createProduct(input: CreateProductInput, operationId?: string): Promise<Product> {
    const trimmedName = input.name?.trim();
    if (!trimmedName) {
      throw new Error('सामान का नाम अनिवार्य है (Product name is required and cannot be empty)');
    }

    const initialStock = input.stockQty !== undefined ? validateQuantity(input.stockQty, 'आरंभिक स्टॉक') : 0;
    const minStock = input.minStock !== undefined ? validateQuantity(input.minStock, 'न्यूनतम स्टॉक') : 0;

    if (input.costPrice !== undefined && input.costPrice !== null) {
      validateQuantity(input.costPrice, 'खरीद मूल्य');
    }
    if (input.sellingPrice !== undefined && input.sellingPrice !== null) {
      validateQuantity(input.sellingPrice, 'बिक्री मूल्य');
    }

    const now = Date.now();
    const productId = input.id || generateId('prod');
    const opId = operationId || generateId('op_init');

    const newProduct: Product = {
      id: productId,
      name: trimmedName,
      nameHi: input.nameHi?.trim(),
      category: input.category?.trim() || 'सामान्य (General)',
      unit: input.unit,
      stockQty: initialStock,
      minStock: minStock,
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      barcode: input.barcode?.trim(),
      supplierId: input.supplierId?.trim(),
      archived: false,
      createdAt: now,
      updatedAt: now,
      averageDailySales: input.averageDailySales,
      supplierLeadTimeDays: input.supplierLeadTimeDays,
      safetyStock: input.safetyStock,
      packSize: input.packSize,
    };

    // Execute atomic IndexedDB transaction
    await this.db.transaction('rw', [this.db.products, this.db.stockMovements], async () => {
      // 1. Insert product
      await this.db.products.add(newProduct);

      // 2. If initial stock > 0, record matching opening_stock movement
      if (initialStock > 0) {
        const openingMovement: StockMovement = {
          id: generateId('mov_open'),
          productId: productId,
          type: 'opening_stock',
          quantity: initialStock,
          unit: newProduct.unit,
          quantityDelta: initialStock, // Positive delta for stock inward
          stockBefore: 0,
          stockAfter: initialStock,
          timestamp: now,
          operationId: opId,
          note: 'आरंभिक स्टॉक (Opening stock)',
        };

        await this.db.stockMovements.add(openingMovement);
      }
    });

    return newProduct;
  }

  /**
   * Retrieves a product by its unique ID.
   */
  async getProductById(id: string): Promise<Product | undefined> {
    return this.db.products.get(id);
  }

  /**
   * Lists products with optional filtering for archived status and category.
   */
  async listProducts(options: { includeArchived?: boolean; category?: string } = {}): Promise<Product[]> {
    let products = await this.db.products.toArray();

    if (!options.includeArchived) {
      products = products.filter((p) => !p.archived);
    }

    if (options.category) {
      products = products.filter((p) => p.category === options.category);
    }

    return products.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Searches products by English name, Hindi name, or category.
   */
  async searchProducts(query: string, includeArchived: boolean = false): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.listProducts({ includeArchived });
    }

    const all = await this.listProducts({ includeArchived });
    return all.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    });
  }

  /**
   * Updates non-stock product metadata.
   * Note: Stock modifications must use recordSale, recordStockInward, or explicit adjustment movements.
   */
  async updateProduct(id: string, updates: UpdateProductInput): Promise<Product> {
    const existing = await this.db.products.get(id);
    if (!existing) {
      throw new Error(`आइटम नहीं मिला (Product not found with ID: ${id})`);
    }

    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed) {
        throw new Error('सामान का नाम खाली नहीं हो सकता (Product name cannot be empty)');
      }
      existing.name = trimmed;
    }

    if (updates.nameHi !== undefined) existing.nameHi = updates.nameHi.trim();
    if (updates.category !== undefined) existing.category = updates.category.trim();
    if (updates.unit !== undefined) existing.unit = updates.unit;

    if (updates.minStock !== undefined) {
      existing.minStock = validateQuantity(updates.minStock, 'न्यूनतम स्टॉक');
    }
    if (updates.costPrice !== undefined) existing.costPrice = updates.costPrice;
    if (updates.sellingPrice !== undefined) existing.sellingPrice = updates.sellingPrice;
    if (updates.barcode !== undefined) existing.barcode = updates.barcode?.trim();
    if (updates.supplierId !== undefined) existing.supplierId = updates.supplierId?.trim();
    if (updates.archived !== undefined) existing.archived = updates.archived;

    if (updates.averageDailySales !== undefined) existing.averageDailySales = updates.averageDailySales;
    if (updates.supplierLeadTimeDays !== undefined) existing.supplierLeadTimeDays = updates.supplierLeadTimeDays;
    if (updates.safetyStock !== undefined) existing.safetyStock = updates.safetyStock;
    if (updates.packSize !== undefined) existing.packSize = updates.packSize;

    existing.updatedAt = Date.now();

    await this.db.products.put(existing);
    return existing;
  }

  /**
   * Records a sale atomically:
   * 1. Protects against duplicate operationId
   * 2. Reads product inside transaction
   * 3. Validates and converts unit if required
   * 4. Deducts stock using Phase 2 applySale
   * 5. Writes updated product and matching StockMovement in one transaction
   */
  async recordSale(params: {
    productId: string;
    quantity: number;
    unit?: ProductUnit;
    operationId: string;
    note?: string;
    allowNegativeStock?: boolean;
  }): Promise<{ product: Product; movement: StockMovement }> {
    if (!params.operationId || !params.operationId.trim()) {
      throw new Error('ऑपरेशन आईडी अनिवार्य है (operationId is required for duplicate protection)');
    }

    let resultProduct!: Product;
    let resultMovement!: StockMovement;

    await this.db.transaction('rw', [this.db.products, this.db.stockMovements], async () => {
      // 1. Check for duplicate operationId
      const existingOp = await this.db.stockMovements
        .where('operationId')
        .equals(params.operationId)
        .first();

      if (existingOp) {
        throw new Error(
          `डुप्लिकेट ऑपरेशन: यह बिक्री पहले ही दर्ज हो चुकी है (Duplicate operation: sale already recorded with ID: ${params.operationId})`
        );
      }

      // 2. Read product within transaction to prevent stale data
      const product = await this.db.products.get(params.productId);
      if (!product) {
        throw new Error(`आइटम नहीं मिला (Product not found with ID: ${params.productId})`);
      }
      if (product.archived) {
        throw new Error('आर्काइव किए गए आइटम की बिक्री दर्ज नहीं हो सकती (Cannot record sale for archived product)');
      }

      // 3. Unit validation & conversion
      let saleQuantityInProductUnit = validateQuantity(params.quantity, 'बिक्री मात्रा');
      if (params.unit && params.unit !== product.unit) {
        saleQuantityInProductUnit = convertUnit(saleQuantityInProductUnit, params.unit, product.unit);
      }

      // 4. Calculate new stock using pure Phase 2 domain calculation
      const stockBefore = product.stockQty;
      const stockAfter = applySale(stockBefore, saleQuantityInProductUnit, {
        allowNegativeStock: params.allowNegativeStock,
      });

      const now = Date.now();

      // 5. Update Product
      product.stockQty = stockAfter;
      product.lastSaleAt = now;
      product.updatedAt = now;
      await this.db.products.put(product);

      // 6. Create matching StockMovement
      // Sign Convention: quantity is positive; quantityDelta is -quantity for sales
      const movement: StockMovement = {
        id: generateId('mov_sale'),
        productId: product.id,
        type: 'sale',
        quantity: saleQuantityInProductUnit,
        unit: product.unit,
        quantityDelta: roundDecimal(-saleQuantityInProductUnit),
        stockBefore: stockBefore,
        stockAfter: stockAfter,
        timestamp: now,
        operationId: params.operationId,
        note: params.note?.trim() || 'दुकान बिक्री (Retail Sale)',
      };

      await this.db.stockMovements.add(movement);

      resultProduct = product;
      resultMovement = movement;
    });

    return { product: resultProduct, movement: resultMovement };
  }

  /**
   * Records stock inward / received stock atomically:
   * 1. Protects against duplicate operationId
   * 2. Reads product inside transaction
   * 3. Validates and converts unit if required
   * 4. Increases stock using Phase 2 applyStockInward
   * 5. Writes updated product and matching StockMovement in one transaction
   */
  async recordStockInward(params: {
    productId: string;
    quantity: number;
    unit?: ProductUnit;
    operationId: string;
    note?: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    if (!params.operationId || !params.operationId.trim()) {
      throw new Error('ऑपरेशन आईडी अनिवार्य है (operationId is required for duplicate protection)');
    }

    let resultProduct!: Product;
    let resultMovement!: StockMovement;

    await this.db.transaction('rw', [this.db.products, this.db.stockMovements], async () => {
      // 1. Duplicate check
      const existingOp = await this.db.stockMovements
        .where('operationId')
        .equals(params.operationId)
        .first();

      if (existingOp) {
        throw new Error(
          `डुप्लिकेट ऑपरेशन: यह माल आवक पहले ही दर्ज हो चुकी है (Duplicate operation: inward already recorded with ID: ${params.operationId})`
        );
      }

      // 2. Read product
      const product = await this.db.products.get(params.productId);
      if (!product) {
        throw new Error(`आइटम नहीं मिला (Product not found with ID: ${params.productId})`);
      }

      // 3. Unit validation & conversion
      let inwardQuantityInProductUnit = validateQuantity(params.quantity, 'आवक मात्रा');
      if (params.unit && params.unit !== product.unit) {
        inwardQuantityInProductUnit = convertUnit(inwardQuantityInProductUnit, params.unit, product.unit);
      }

      // 4. Calculate new stock using pure Phase 2 domain calculation
      const stockBefore = product.stockQty;
      const stockAfter = applyStockInward(stockBefore, inwardQuantityInProductUnit);

      const now = Date.now();

      // 5. Update Product
      product.stockQty = stockAfter;
      product.updatedAt = now;
      await this.db.products.put(product);

      // 6. Create matching StockMovement
      // Sign Convention: quantity is positive; quantityDelta is +quantity for inward
      const movement: StockMovement = {
        id: generateId('mov_inward'),
        productId: product.id,
        type: 'received',
        quantity: inwardQuantityInProductUnit,
        unit: product.unit,
        quantityDelta: roundDecimal(inwardQuantityInProductUnit),
        stockBefore: stockBefore,
        stockAfter: stockAfter,
        timestamp: now,
        operationId: params.operationId,
        note: params.note?.trim() || 'सप्लायर माल आया (Stock received)',
      };

      await this.db.stockMovements.add(movement);

      resultProduct = product;
      resultMovement = movement;
    });

    return { product: resultProduct, movement: resultMovement };
  }

  /**
   * Retrieves stock movement history for a product, ordered by timestamp descending.
   */
  async getProductMovements(productId: string): Promise<StockMovement[]> {
    const movements = await this.db.stockMovements
      .where('productId')
      .equals(productId)
      .toArray();

    return movements.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Retrieves recent stock movements across the entire store, ordered by timestamp descending.
   */
  async getRecentMovements(limit: number = 50): Promise<StockMovement[]> {
    const movements = await this.db.stockMovements
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();

    return movements;
  }

  /**
   * Seeds realistic sample products if and only if the database is currently empty.
   * Returns true if seeded, false if existing products were already present.
   */
  async seedSampleDataIfEmpty(sampleProducts: CreateProductInput[]): Promise<boolean> {
    const count = await this.db.products.count();
    if (count > 0) {
      return false; // Preserve existing user data
    }

    for (const item of sampleProducts) {
      await this.createProduct(item, `op_seed_${item.id || generateId()}`);
    }

    return true;
  }

  /**
   * Clears all products and movements. Used for testing or explicit user reset.
   */
  async clearAllData(): Promise<void> {
    await this.db.transaction('rw', [this.db.products, this.db.stockMovements], async () => {
      await this.db.products.clear();
      await this.db.stockMovements.clear();
    });
  }
}

export const productRepository = new ProductRepository(defaultDb);
