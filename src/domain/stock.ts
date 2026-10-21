import { roundDecimal, validateQuantity } from './units';
import { StockStatus, SlowMovingStatus } from './types';

export interface ApplySaleOptions {
  allowNegativeStock?: boolean;
}

/**
 * Calculates remaining stock after a sale is recorded.
 * Defaults to preventing negative stock.
 */
export function applySale(
  currentStock: number,
  saleQuantity: number,
  options: ApplySaleOptions = { allowNegativeStock: false }
): number {
  const validCurrent = validateQuantity(currentStock, 'मौजूदा स्टॉक (Current stock)');
  const validSale = validateQuantity(saleQuantity, 'बिक्री मात्रा (Sale quantity)');

  if (validSale <= 0) {
    throw new Error('बिक्री मात्रा शून्य से अधिक होनी चाहिए (Sale quantity must be greater than zero)');
  }

  const remaining = roundDecimal(validCurrent - validSale);

  if (!options.allowNegativeStock && remaining < 0) {
    throw new Error(
      `स्टॉक से अधिक बिक्री नहीं हो सकती: उपलब्ध ${validCurrent}, बिक्री मांगी ${validSale} (Insufficient stock: available ${validCurrent}, requested ${validSale})`
    );
  }

  return remaining;
}

/**
 * Calculates updated stock when new stock is received.
 */
export function applyStockInward(
  currentStock: number,
  inwardQuantity: number
): number {
  const validCurrent = validateQuantity(currentStock, 'मौजूदा स्टॉक (Current stock)');
  const validInward = validateQuantity(inwardQuantity, 'आवक मात्रा (Inward quantity)');

  if (validInward <= 0) {
    throw new Error('आवक मात्रा शून्य से अधिक होनी चाहिए (Inward quantity must be greater than zero)');
  }

  return roundDecimal(validCurrent + validInward);
}

/**
 * Determines whether an item is out of stock, low stock, or adequate.
 * Validates stock quantity and minimum threshold.
 */
export function getStockStatus(stockQty: number, minStock: number): StockStatus {
  const validStock = validateQuantity(stockQty, 'स्टॉक मात्रा (Stock quantity)');
  const validMin = validateQuantity(minStock, 'न्यूनतम सीमा (Minimum stock threshold)');

  if (validStock === 0) {
    return 'out_of_stock';
  }

  if (validStock <= validMin) {
    return 'low_stock';
  }

  return 'adequate';
}

export interface SlowMovingParams {
  createdAt: number;
  lastSaleAt?: number | null;
  nowTimestamp?: number;
  inactivityThresholdDays?: number; // default: 30 days
  newProductGraceDays?: number;    // default: 14 days
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Evaluates whether a product is slow-moving, stagnant, active, or a newly added product.
 * - Newly added products within grace days are not marked as dead stock.
 * - Products with prior sales but no sales past inactivityThreshold are slow-moving.
 * - Products with zero sales ever and age past grace days are stagnant/unsold.
 */
export function getSlowMovingStatus(params: SlowMovingParams): SlowMovingStatus {
  const now = params.nowTimestamp ?? Date.now();
  const inactivityThresholdDays = params.inactivityThresholdDays ?? 30;
  const newProductGraceDays = params.newProductGraceDays ?? 14;

  if (params.createdAt > now) {
    throw new Error('निर्माण समय भविष्य में नहीं हो सकता (createdAt cannot be in the future)');
  }

  const daysSinceCreation = Math.max(0, (now - params.createdAt) / MILLISECONDS_PER_DAY);
  const roundedDaysSinceCreation = Math.floor(daysSinceCreation);

  // 1. Is this a new product still in grace period without sales?
  if (!params.lastSaleAt && daysSinceCreation <= newProductGraceDays) {
    return {
      isSlowMoving: false,
      category: 'new_product',
      daysSinceLastSale: null,
      daysSinceCreation: roundedDaysSinceCreation,
      reason: `नया आइटम जोड़ा गया (${roundedDaysSinceCreation} दिन पहले)। अभी पर्याप्त समय नहीं हुआ है।`,
    };
  }

  // 2. Product has never sold and has passed the new product grace period
  if (!params.lastSaleAt) {
    return {
      isSlowMoving: true,
      category: 'stagnant_unsold',
      daysSinceLastSale: null,
      daysSinceCreation: roundedDaysSinceCreation,
      reason: `शुरुआत से अब तक एक भी बिक्री नहीं हुई (${roundedDaysSinceCreation} दिन से बिना बिक्री)।`,
    };
  }

  // 3. Product has sold before; check days since last sale
  if (params.lastSaleAt > now) {
    throw new Error('अंतिम बिक्री समय भविष्य में नहीं हो सकता (lastSaleAt cannot be in the future)');
  }

  const daysSinceLastSale = Math.max(0, (now - params.lastSaleAt) / MILLISECONDS_PER_DAY);
  const roundedDaysSinceSale = Math.floor(daysSinceLastSale);

  if (daysSinceLastSale > inactivityThresholdDays) {
    return {
      isSlowMoving: true,
      category: 'slow_moving',
      daysSinceLastSale: roundedDaysSinceSale,
      daysSinceCreation: roundedDaysSinceCreation,
      reason: `पिछले ${roundedDaysSinceSale} दिनों से कोई बिक्री नहीं हुई (सीमा: ${inactivityThresholdDays} दिन)।`,
    };
  }

  return {
    isSlowMoving: false,
    category: 'active',
    daysSinceLastSale: roundedDaysSinceSale,
    daysSinceCreation: roundedDaysSinceCreation,
    reason: `सक्रिय बिक्री: अंतिम बिक्री ${roundedDaysSinceSale} दिन पहले हुई थी।`,
  };
}

