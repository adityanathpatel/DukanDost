/**
 * Domain types for Dukan Dost
 */

export type StoreCategory =
  | 'Kirana / Grocery'
  | 'Electrical / Hardware'
  | 'Medical / Pharmacy'
  | 'Apparel / Garments'
  | 'General Store';

export interface ShopkeeperProfile {
  shopkeeperName: string;
  storeName: string;
  storeCategory: StoreCategory;
  storeAddress: string;
  pincode: string;
  phone: string;
  gstin?: string;
  email?: string;
  createdAt?: number;
}

export type ProductUnit = 
  | 'piece'   // पीस (नग)
  | 'packet'  // पैकेट
  | 'bottle'  // बोतल
  | 'dozen'   // दर्जन
  | 'kg'      // किलो
  | 'half_kg' // आधा किलो (0.5 kg)
  | 'g'       // ग्राम
  | 'liter'   // लीटर (L)
  | 'ml'      // मिलीलीटर
  | 'box';    // डिब्बा

export type StockStatus = 'out_of_stock' | 'low_stock' | 'adequate';

export type SlowMovingCategory = 'active' | 'slow_moving' | 'stagnant_unsold' | 'new_product';

export interface SlowMovingStatus {
  isSlowMoving: boolean;
  category: SlowMovingCategory;
  daysSinceLastSale: number | null;
  daysSinceCreation: number;
  reason: string;
}

export type ReorderCalculationBasis = 
  | 'sales_velocity' 
  | 'min_stock_fallback' 
  | 'insufficient_data';

export interface ReorderResult {
  targetStock: number;
  reorderQuantity: number;
  basis: ReorderCalculationBasis;
  explanation: string;
  isReorderNeeded: boolean;
}

export interface ReorderCalculationParams {
  currentStock: number;
  incomingStock?: number;
  averageDailySales?: number | null;
  supplierLeadTimeDays?: number;
  safetyStock?: number;
  minStock?: number;
  packSize?: number;
  unit: ProductUnit;
}

export interface Product {
  id: string;
  name: string;
  nameHi?: string;
  category: string;
  unit: ProductUnit;
  stockQty: number;      // Decimal quantity (e.g. 1.5, 0.5)
  minStock: number;      // Threshold for low-stock alert
  costPrice?: number;    // Buying price
  sellingPrice?: number; // Retail selling price
  barcode?: string;
  supplierId?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  lastSaleAt?: number;
  averageDailySales?: number | null;
  supplierLeadTimeDays?: number;
  safetyStock?: number;
  packSize?: number;
}

export interface CreateProductInput {
  id?: string;
  name: string;
  nameHi?: string;
  category?: string;
  unit: ProductUnit;
  stockQty?: number;
  minStock?: number;
  costPrice?: number;
  sellingPrice?: number;
  barcode?: string;
  supplierId?: string;
  averageDailySales?: number | null;
  supplierLeadTimeDays?: number;
  safetyStock?: number;
  packSize?: number;
}

export interface UpdateProductInput {
  name?: string;
  nameHi?: string;
  category?: string;
  unit?: ProductUnit;
  minStock?: number;
  costPrice?: number;
  sellingPrice?: number;
  barcode?: string;
  supplierId?: string;
  archived?: boolean;
  averageDailySales?: number | null;
  supplierLeadTimeDays?: number;
  safetyStock?: number;
  packSize?: number;
}

export type MovementType = 'sale' | 'received' | 'opening_stock' | 'adjustment' | 'return';

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;      // Positive quantity of the operation
  unit: ProductUnit;
  quantityDelta: number; // Signed delta (+ for increase, - for decrease)
  stockBefore: number;   // Stock before operation
  stockAfter: number;    // Stock after operation
  timestamp: number;     // Epoch ms
  operationId: string;   // Unique operation ID for duplicate submission prevention
  note?: string;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;      // Strictly positive decimal
  unit: ProductUnit;
  timestamp: number;
  operationId: string;
  note?: string;
}

export interface ShopSettings {
  id?: string;
  shopName: string;
  language: 'hi' | 'en';
  defaultLeadTimeDays: number;
  defaultSafetyStock: number;
}
