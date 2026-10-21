import { describe, it, expect } from 'vitest';
import {
  roundDecimal,
  validateQuantity,
  areUnitsCompatible,
  convertUnit,
  addQuantities,
  subtractQuantities,
  applySale,
  applyStockInward,
  getStockStatus,
  getSlowMovingStatus,
  calculateReorder,
} from './index';

describe('Phase 2: Quantity and Unit Logic', () => {
  it('1.5 kg - 0.5 kg = 1 kg', () => {
    const result = subtractQuantities(1.5, 'kg', 0.5, 'kg');
    expect(result).toBe(1.0);
  });

  it('1.25 L + 0.75 L = 2 L', () => {
    const result = addQuantities(1.25, 'liter', 0.75, 'liter');
    expect(result).toBe(2.0);
  });

  it('500 g converts to 0.5 kg', () => {
    const converted = convertUnit(500, 'g', 'kg');
    expect(converted).toBe(0.5);
  });

  it('areUnitsCompatible identifies compatible and incompatible unit pairs', () => {
    expect(areUnitsCompatible('kg', 'g')).toBe(true);
    expect(areUnitsCompatible('liter', 'ml')).toBe(true);
    expect(areUnitsCompatible('piece', 'dozen')).toBe(true);
    expect(areUnitsCompatible('kg', 'liter')).toBe(false);
    expect(areUnitsCompatible('packet', 'piece')).toBe(false);
  });

  it('roundDecimal accurately rounds to specified precision', () => {
    expect(roundDecimal(1.23456, 2)).toBe(1.23);
    expect(roundDecimal(1.23456, 4)).toBe(1.2346);
    expect(() => roundDecimal(NaN)).toThrow(/अमान्य|non-finite/i);
  });

  it('1.5 dozen equals 18 pieces', () => {
    const converted = convertUnit(1.5, 'dozen', 'piece');
    expect(converted).toBe(18);
  });

  it('incompatible units are rejected', () => {
    // Cannot convert dozen to kg
    expect(() => convertUnit(1, 'dozen', 'kg')).toThrow(/इकाई असंगत है|incompatible/i);

    // Cannot convert packet to liter
    expect(() => convertUnit(2, 'packet', 'liter')).toThrow(/इकाई असंगत है|incompatible/i);

    // Cannot add kg to liter
    expect(() => addQuantities(1, 'kg', 1, 'liter')).toThrow(/इकाई असंगत है|incompatible/i);
  });

  it('negative, NaN, and infinite quantities are rejected', () => {
    expect(() => validateQuantity(-1)).toThrow(/शून्य से कम|negative/i);
    expect(() => validateQuantity(NaN)).toThrow(/अमान्य|valid/i);
    expect(() => validateQuantity(Infinity)).toThrow(/अमान्य|valid/i);
    expect(() => validateQuantity(-Infinity)).toThrow(/अमान्य|valid/i);
  });

  it('repeated fractional operations do not accumulate floating point rounding errors', () => {
    // Repeatedly add 0.1 ten times: standard JS gives 0.9999999999999999 without rounding
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum = addQuantities(sum, 'kg', 0.1, 'kg');
    }
    expect(sum).toBe(1.0);

    // Repeatedly subtract 0.05 twenty times from 1.0 kg
    let stock = 1.0;
    for (let i = 0; i < 20; i++) {
      stock = subtractQuantities(stock, 'kg', 0.05, 'kg');
    }
    expect(stock).toBe(0);
  });
});

describe('Phase 2: Stock Calculation Logic', () => {
  it('sale reduces stock correctly', () => {
    const remaining = applySale(10, 3.5);
    expect(remaining).toBe(6.5);
  });

  it('adding stock increases stock correctly', () => {
    const updated = applyStockInward(6.5, 5.5);
    expect(updated).toBe(12.0);
  });

  it('sale exceeding available stock is rejected by default', () => {
    expect(() => applySale(5, 5.5)).toThrow(/स्टॉक से अधिक बिक्री|Insufficient stock/i);
  });

  it('sale with explicit allowNegativeStock works if policy permits', () => {
    const remaining = applySale(5, 6, { allowNegativeStock: true });
    expect(remaining).toBe(-1.0);
  });

  it('zero sale quantity or negative sale is rejected', () => {
    expect(() => applySale(10, 0)).toThrow(/शून्य से अधिक|greater than zero/i);
    expect(() => applySale(10, -2)).toThrow(/शून्य से कम|negative/i);
  });

  it('zero stock is classified as out of stock', () => {
    expect(getStockStatus(0, 10)).toBe('out_of_stock');
  });

  it('stock equal to the minimum threshold is classified as low stock', () => {
    expect(getStockStatus(10, 10)).toBe('low_stock');
    expect(getStockStatus(5, 10)).toBe('low_stock');
  });

  it('stock above the threshold is adequate', () => {
    expect(getStockStatus(10.1, 10)).toBe('adequate');
    expect(getStockStatus(25, 10)).toBe('adequate');
  });

  it('invalid stock values in status check throw clear errors', () => {
    expect(() => getStockStatus(-1, 5)).toThrow(/शून्य से कम|negative/i);
    expect(() => getStockStatus(NaN, 5)).toThrow(/अमान्य|valid/i);
  });
});

describe('Phase 2: Slow-Moving and Stagnant Stock Logic', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = 1700000000000; // Fixed timestamp for determinism

  it('a recently sold product is not flagged (active)', () => {
    const status = getSlowMovingStatus({
      createdAt: now - (60 * ONE_DAY_MS),
      lastSaleAt: now - (5 * ONE_DAY_MS), // sold 5 days ago (threshold: 30)
      nowTimestamp: now,
      inactivityThresholdDays: 30,
    });

    expect(status.isSlowMoving).toBe(false);
    expect(status.category).toBe('active');
    expect(status.daysSinceLastSale).toBe(5);
  });

  it('a previously sold product beyond the threshold is flagged (slow_moving)', () => {
    const status = getSlowMovingStatus({
      createdAt: now - (90 * ONE_DAY_MS),
      lastSaleAt: now - (45 * ONE_DAY_MS), // sold 45 days ago (threshold: 30)
      nowTimestamp: now,
      inactivityThresholdDays: 30,
    });

    expect(status.isSlowMoving).toBe(true);
    expect(status.category).toBe('slow_moving');
    expect(status.daysSinceLastSale).toBe(45);
  });

  it('a newly added product within grace period is not flagged as dead stock', () => {
    const status = getSlowMovingStatus({
      createdAt: now - (5 * ONE_DAY_MS), // created 5 days ago
      lastSaleAt: null, // no sales yet
      nowTimestamp: now,
      newProductGraceDays: 14,
    });

    expect(status.isSlowMoving).toBe(false);
    expect(status.category).toBe('new_product');
    expect(status.daysSinceLastSale).toBeNull();
  });

  it('a product with no sales history past grace period is distinguished as stagnant/unsold', () => {
    const status = getSlowMovingStatus({
      createdAt: now - (40 * ONE_DAY_MS), // created 40 days ago
      lastSaleAt: null, // never sold
      nowTimestamp: now,
      newProductGraceDays: 14,
    });

    expect(status.isSlowMoving).toBe(true);
    expect(status.category).toBe('stagnant_unsold');
    expect(status.daysSinceLastSale).toBeNull();
    expect(status.daysSinceCreation).toBe(40);
  });
});

describe('Phase 2: Reorder Calculation Logic', () => {
  it('correct target stock and reorder quantity from sales velocity', () => {
    // avg daily sales = 5 pkt/day, lead time = 3 days, safety stock = 5 pkt
    // targetStock = (5 * 3) + 5 = 20 pkt
    // currentStock = 4 pkt, incomingStock = 0
    // reorderQuantity = 20 - 4 = 16 pkt
    const result = calculateReorder({
      currentStock: 4,
      incomingStock: 0,
      averageDailySales: 5,
      supplierLeadTimeDays: 3,
      safetyStock: 5,
      unit: 'packet',
    });

    expect(result.targetStock).toBe(20);
    expect(result.reorderQuantity).toBe(16);
    expect(result.basis).toBe('sales_velocity');
    expect(result.isReorderNeeded).toBe(true);
  });

  it('incoming stock reduces the suggested reorder', () => {
    // targetStock = 20 pkt, currentStock = 4, incomingStock = 10
    // reorderQuantity = max(0, 20 - 4 - 10) = 6 pkt
    const result = calculateReorder({
      currentStock: 4,
      incomingStock: 10,
      averageDailySales: 5,
      supplierLeadTimeDays: 3,
      safetyStock: 5,
      unit: 'packet',
    });

    expect(result.targetStock).toBe(20);
    expect(result.reorderQuantity).toBe(6);
    expect(result.isReorderNeeded).toBe(true);
  });

  it('no reorder is suggested when existing and incoming stock are sufficient', () => {
    // targetStock = 20, currentStock = 15, incomingStock = 10 (total 25 >= 20)
    const result = calculateReorder({
      currentStock: 15,
      incomingStock: 10,
      averageDailySales: 5,
      supplierLeadTimeDays: 3,
      safetyStock: 5,
      unit: 'packet',
    });

    expect(result.reorderQuantity).toBe(0);
    expect(result.isReorderNeeded).toBe(false);
  });

  it('supports decimal reorder quantities for loose goods', () => {
    // avg sales = 1.5 kg/day, lead time = 2 days, safety = 1.0 kg -> target = 4.0 kg
    // currentStock = 1.25 kg -> reorder = 2.75 kg
    const result = calculateReorder({
      currentStock: 1.25,
      incomingStock: 0,
      averageDailySales: 1.5,
      supplierLeadTimeDays: 2,
      safetyStock: 1.0,
      unit: 'kg',
    });

    expect(result.targetStock).toBe(4.0);
    expect(result.reorderQuantity).toBe(2.75);
    expect(result.isReorderNeeded).toBe(true);
  });

  it('rounds up to configured pack size if specified', () => {
    // target = 20, current = 4 -> raw reorder = 16.
    // If supplier sells in packs of 10, should round up to 20.
    const result = calculateReorder({
      currentStock: 4,
      averageDailySales: 5,
      supplierLeadTimeDays: 3,
      safetyStock: 5,
      packSize: 10,
      unit: 'packet',
    });

    expect(result.reorderQuantity).toBe(20);
  });

  it('missing sales history falls back to configured minStock threshold', () => {
    // averageDailySales is not provided (null/undefined)
    // currentStock = 3, minStock = 10 -> reorder = 7
    const result = calculateReorder({
      currentStock: 3,
      incomingStock: 0,
      averageDailySales: null,
      minStock: 10,
      unit: 'bottle',
    });

    expect(result.basis).toBe('min_stock_fallback');
    expect(result.targetStock).toBe(10);
    expect(result.reorderQuantity).toBe(7);
    expect(result.isReorderNeeded).toBe(true);
  });

  it('missing both sales history and minStock returns insufficient_data', () => {
    const result = calculateReorder({
      currentStock: 2,
      averageDailySales: null,
      unit: 'piece',
    });

    expect(result.basis).toBe('insufficient_data');
    expect(result.reorderQuantity).toBe(0);
    expect(result.isReorderNeeded).toBe(false);
  });

  it('invalid lead times, negative stock, and NaN inputs are rejected', () => {
    expect(() =>
      calculateReorder({
        currentStock: -5,
        averageDailySales: 2,
        unit: 'packet',
      })
    ).toThrow(/शून्य से कम|negative/i);

    expect(() =>
      calculateReorder({
        currentStock: 10,
        averageDailySales: NaN,
        unit: 'packet',
      })
    ).toThrow(/अमान्य|valid/i);

    expect(() =>
      calculateReorder({
        currentStock: 10,
        averageDailySales: 2,
        supplierLeadTimeDays: -1,
        unit: 'packet',
      })
    ).toThrow(/शून्य से कम|negative/i);

    expect(() =>
      calculateReorder({
        currentStock: 10,
        minStock: -2,
        unit: 'packet',
      })
    ).toThrow(/शून्य से कम|negative/i);
  });

  it('rejects future timestamps in slow moving checks', () => {
    const now = Date.now();
    expect(() =>
      getSlowMovingStatus({
        createdAt: now + 100000,
        nowTimestamp: now,
      })
    ).toThrow(/भविष्य|future/i);
  });
});
