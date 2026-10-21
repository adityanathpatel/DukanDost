import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MeriDukaanDatabase } from './db';
import { ProductRepository } from './productRepository';

describe('Phase 3: Database, Persistence & Stock Ledger', () => {
  let testDb: MeriDukaanDatabase;
  let repo: ProductRepository;

  beforeEach(() => {
    // Unique test database name per test run to prevent any leakage
    testDb = new MeriDukaanDatabase(`Test_MeriDukaan_${Date.now()}_${Math.random()}`);
    repo = new ProductRepository(testDb);
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('initializes database with correct schema tables', () => {
    expect(testDb.tables.map((t) => t.name)).toContain('products');
    expect(testDb.tables.map((t) => t.name)).toContain('stockMovements');
    expect(testDb.tables.map((t) => t.name)).toContain('settings');
  });

  it('handles empty database behavior gracefully', async () => {
    const products = await repo.listProducts();
    expect(products).toEqual([]);

    const movements = await repo.getRecentMovements();
    expect(movements).toEqual([]);

    const nonExistent = await repo.getProductById('unknown_id');
    expect(nonExistent).toBeUndefined();
  });

  it('creates and retrieves a product with zero opening stock', async () => {
    const product = await repo.createProduct({
      name: 'Tata Salt 1kg',
      nameHi: 'टाटा नमक 1kg',
      category: 'किराना',
      unit: 'packet',
      stockQty: 0,
      minStock: 10,
      sellingPrice: 28,
    });

    expect(product.id).toBeDefined();
    expect(product.stockQty).toBe(0);

    const retrieved = await repo.getProductById(product.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Tata Salt 1kg');
    expect(retrieved?.unit).toBe('packet');

    // No opening stock movement should be created if stockQty is 0
    const movements = await repo.getProductMovements(product.id);
    expect(movements).toHaveLength(0);
  });

  it('creates product with initial stock and matching opening_stock movement in same transaction', async () => {
    const product = await repo.createProduct({
      name: 'Loose Sugar (चीनी)',
      category: 'अनाज',
      unit: 'kg',
      stockQty: 25.5,
      minStock: 10,
    });

    expect(product.stockQty).toBe(25.5);

    // Verify movement entry
    const movements = await repo.getProductMovements(product.id);
    expect(movements).toHaveLength(1);

    const openMov = movements[0];
    expect(openMov.type).toBe('opening_stock');
    expect(openMov.quantity).toBe(25.5);
    expect(openMov.quantityDelta).toBe(25.5);
    expect(openMov.stockBefore).toBe(0);
    expect(openMov.stockAfter).toBe(25.5);
    expect(openMov.unit).toBe('kg');
  });

  it('updates product metadata and searches products', async () => {
    const product = await repo.createProduct({
      name: 'Fortune Mustard Oil 1L',
      nameHi: 'फॉर्च्यून सरसों तेल',
      category: 'तेल',
      unit: 'liter',
      stockQty: 5,
      minStock: 10,
    });

    // Update product
    const updated = await repo.updateProduct(product.id, {
      minStock: 15,
      sellingPrice: 160,
    });

    expect(updated.minStock).toBe(15);
    expect(updated.sellingPrice).toBe(160);

    // Search by English
    const searchEng = await repo.searchProducts('Fortune');
    expect(searchEng).toHaveLength(1);
    expect(searchEng[0].id).toBe(product.id);

    // Search by Hindi
    const searchHi = await repo.searchProducts('सरसों');
    expect(searchHi).toHaveLength(1);
    expect(searchHi[0].id).toBe(product.id);
  });

  it('records a sale and matching ledger entry with correct sign convention', async () => {
    const product = await repo.createProduct({
      name: 'Maggi 2-Min Noodles 70g',
      unit: 'packet',
      stockQty: 10,
      minStock: 5,
    });

    const opId = 'sale_op_001';
    const saleResult = await repo.recordSale({
      productId: product.id,
      quantity: 3,
      operationId: opId,
      note: 'शाम की बिक्री',
    });

    // Check updated product in DB
    expect(saleResult.product.stockQty).toBe(7);
    const persistedProduct = await repo.getProductById(product.id);
    expect(persistedProduct?.stockQty).toBe(7);

    // Check matching movement
    const movement = saleResult.movement;
    expect(movement.type).toBe('sale');
    expect(movement.quantity).toBe(3);
    expect(movement.quantityDelta).toBe(-3); // Signed delta is negative for sales
    expect(movement.stockBefore).toBe(10);
    expect(movement.stockAfter).toBe(7);
    expect(movement.operationId).toBe(opId);
    expect(movement.note).toBe('शाम की बिक्री');
  });

  it('records stock inward and matching ledger entry with correct sign convention', async () => {
    const product = await repo.createProduct({
      name: 'Dettol Soap 75g',
      unit: 'piece',
      stockQty: 4,
      minStock: 10,
    });

    const opId = 'inward_op_001';
    const inwardResult = await repo.recordStockInward({
      productId: product.id,
      quantity: 12,
      operationId: opId,
      note: 'सप्लायर बिल #452',
    });

    expect(inwardResult.product.stockQty).toBe(16);
    const persisted = await repo.getProductById(product.id);
    expect(persisted?.stockQty).toBe(16);

    const movement = inwardResult.movement;
    expect(movement.type).toBe('received');
    expect(movement.quantity).toBe(12);
    expect(movement.quantityDelta).toBe(12); // Signed delta is positive for inward
    expect(movement.stockBefore).toBe(4);
    expect(movement.stockAfter).toBe(16);
  });

  it('rejects sale exceeding available stock (preventing negative stock)', async () => {
    const product = await repo.createProduct({
      name: 'Aashirvaad Atta 5kg',
      unit: 'packet',
      stockQty: 2,
      minStock: 5,
    });

    await expect(
      repo.recordSale({
        productId: product.id,
        quantity: 5, // Exceeds available stock of 2
        operationId: 'excessive_sale_001',
      })
    ).rejects.toThrow(/स्टॉक से अधिक बिक्री|Insufficient stock/i);

    // Verify stock remains untouched
    const unchanged = await repo.getProductById(product.id);
    expect(unchanged?.stockQty).toBe(2);

    // Verify no movement was saved
    const movements = await repo.getProductMovements(product.id);
    expect(movements).toHaveLength(1); // Only opening_stock
  });

  it('supports decimal sale and compatible unit conversion (500g from 2kg stock)', async () => {
    const product = await repo.createProduct({
      name: 'Basmati Rice',
      unit: 'kg',
      stockQty: 2.0,
      minStock: 5.0,
    });

    // Sell 500 g from product tracked in kg
    const saleResult = await repo.recordSale({
      productId: product.id,
      quantity: 500,
      unit: 'g',
      operationId: 'rice_sale_500g',
    });

    // 2 kg - 0.5 kg = 1.5 kg
    expect(saleResult.product.stockQty).toBe(1.5);
    expect(saleResult.movement.quantity).toBe(0.5);
    expect(saleResult.movement.unit).toBe('kg');
    expect(saleResult.movement.stockAfter).toBe(1.5);
  });

  it('rejects incompatible units when recording sale', async () => {
    const product = await repo.createProduct({
      name: 'Parle-G 100g',
      unit: 'packet',
      stockQty: 20,
    });

    // Attempting to sell 2 kg of a packet-tracked item
    await expect(
      repo.recordSale({
        productId: product.id,
        quantity: 2,
        unit: 'kg',
        operationId: 'incompatible_sale',
      })
    ).rejects.toThrow(/इकाई असंगत है|incompatible/i);
  });

  it('rejects duplicate operationId to protect against duplicate submissions', async () => {
    const product = await repo.createProduct({
      name: 'Amul Butter 100g',
      unit: 'packet',
      stockQty: 10,
    });

    const opId = 'unique_op_123';

    // First submission succeeds
    await repo.recordSale({
      productId: product.id,
      quantity: 2,
      operationId: opId,
    });

    // Second submission with exact same operationId must be rejected!
    await expect(
      repo.recordSale({
        productId: product.id,
        quantity: 2,
        operationId: opId,
      })
    ).rejects.toThrow(/डुप्लिकेट ऑपरेशन|Duplicate/i);

    // Verify stock was only deducted once (10 - 2 = 8, not 6)
    const current = await repo.getProductById(product.id);
    expect(current?.stockQty).toBe(8);
  });

  it('orders movement history by timestamp descending', async () => {
    const product = await repo.createProduct({
      name: 'Colgate Toothpaste',
      unit: 'piece',
      stockQty: 5,
    });

    // Sleep slightly to guarantee different timestamps
    await repo.recordSale({
      productId: product.id,
      quantity: 1,
      operationId: 'op_hist_1',
    });

    await repo.recordStockInward({
      productId: product.id,
      quantity: 10,
      operationId: 'op_hist_2',
    });

    await repo.recordSale({
      productId: product.id,
      quantity: 2,
      operationId: 'op_hist_3',
    });

    const movements = await repo.getProductMovements(product.id);
    expect(movements).toHaveLength(4); // opening + 2 sales + 1 inward

    // First movement in list must be the most recent
    expect(movements[0].operationId).toBe('op_hist_3');
    for (let i = 0; i < movements.length - 1; i++) {
      expect(movements[i].timestamp).toBeGreaterThanOrEqual(movements[i + 1].timestamp);
    }
  });

  it('guarantees atomic rollback if an error occurs during stock transaction', async () => {
    const product = await repo.createProduct({
      name: 'Transaction Rollback Test Item',
      unit: 'packet',
      stockQty: 20,
    });

    // Simulate an error inside the transaction after product modification
    await expect(
      testDb.transaction('rw', [testDb.products, testDb.stockMovements], async () => {
        // Step 1: modify product stock
        await testDb.products.update(product.id, { stockQty: 10 });

        // Step 2: failure occurs before transaction commits
        throw new Error('Simulated database/ledger insertion failure');
      })
    ).rejects.toThrow('Simulated database/ledger insertion failure');

    // Verify rollback: stock must remain 20, not 10!
    const persisted = await repo.getProductById(product.id);
    expect(persisted?.stockQty).toBe(20);
  });

  it('seeds sample data if and only if database is empty', async () => {
    const sample = [
      { name: 'Seed Item 1', unit: 'packet' as const, stockQty: 5 },
      { name: 'Seed Item 2', unit: 'kg' as const, stockQty: 10 },
    ];

    const seeded = await repo.seedSampleDataIfEmpty(sample);
    expect(seeded).toBe(true);

    const count = await testDb.products.count();
    expect(count).toBe(2);

    // Calling it again must return false and not overwrite
    const secondCall = await repo.seedSampleDataIfEmpty([
      { name: 'Seed Item 3', unit: 'piece' as const, stockQty: 2 },
    ]);
    expect(secondCall).toBe(false);
    expect(await testDb.products.count()).toBe(2);
  });
});
