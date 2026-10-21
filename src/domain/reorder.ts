import { roundDecimal, validateQuantity } from './units';
import { ReorderCalculationParams, ReorderResult } from './types';

/**
 * Calculates suggested reorder quantity based on average daily sales,
 * supplier lead time, safety stock, and incoming stock.
 *
 * Formula:
 * targetStock = (averageDailySales * supplierLeadTimeDays) + safetyStock
 * reorderQuantity = max(0, targetStock - currentStock - incomingStock)
 *
 * If sales history is missing, falls back to configured minStock.
 */
export function calculateReorder(params: ReorderCalculationParams): ReorderResult {
  const currentStock = validateQuantity(params.currentStock, 'मौजूदा स्टॉक (Current stock)');
  const incomingStock = validateQuantity(params.incomingStock ?? 0, 'आने वाला स्टॉक (Incoming stock)');

  // Validate optional numeric inputs if provided (reject NaN, negative, Infinity)
  if (params.supplierLeadTimeDays !== undefined && params.supplierLeadTimeDays !== null) {
    validateQuantity(params.supplierLeadTimeDays, 'सप्लायर डिलीवरी दिन (Supplier lead time)');
  }
  if (params.safetyStock !== undefined && params.safetyStock !== null) {
    validateQuantity(params.safetyStock, 'सुरक्षा स्टॉक (Safety stock)');
  }
  if (params.minStock !== undefined && params.minStock !== null) {
    validateQuantity(params.minStock, 'न्यूनतम स्टॉक सीमा (Minimum stock threshold)');
  }
  if (params.packSize !== undefined && params.packSize !== null) {
    validateQuantity(params.packSize, 'पैक साइज (Pack size)');
  }

  // 1. Check if sales velocity is provided
  if (params.averageDailySales !== undefined && params.averageDailySales !== null) {
    const avgDailySales = validateQuantity(params.averageDailySales, 'दैनिक औसत बिक्री (Average daily sales)');
    const leadTime = params.supplierLeadTimeDays ?? 2;
    const safetyStock = params.safetyStock ?? 0;

    const targetStock = roundDecimal((avgDailySales * leadTime) + safetyStock);
    const netNeeded = targetStock - currentStock - incomingStock;
    let rawReorderQty = Math.max(0, netNeeded);

    // Apply pack size / purchase increment if configured
    if (params.packSize && params.packSize > 0 && rawReorderQty > 0) {
      const pack = params.packSize;
      rawReorderQty = Math.ceil(rawReorderQty / pack) * pack;
    }

    const reorderQuantity = roundDecimal(rawReorderQty);
    const isReorderNeeded = reorderQuantity > 0;

    let explanation = '';
    if (isReorderNeeded) {
      explanation = `अनुमानित दैनिक बिक्री (${avgDailySales} ${params.unit}/दिन) और सप्लायर समय (${leadTime} दिन) के आधार पर ${reorderQuantity} ${params.unit} मंगाएं।`;
    } else {
      explanation = `वर्तमान स्टॉक (${currentStock} ${params.unit}) और आने वाला स्टॉक (${incomingStock} ${params.unit}) लक्ष्य स्टॉक (${targetStock} ${params.unit}) के लिए पर्याप्त है।`;
    }

    return {
      targetStock,
      reorderQuantity,
      basis: 'sales_velocity',
      explanation,
      isReorderNeeded,
    };
  }

  // 2. Fallback to minimum stock threshold if sales velocity is not provided
  if (params.minStock !== undefined && params.minStock !== null) {
    const minStock = params.minStock;
    const targetStock = minStock;
    const netNeeded = minStock - currentStock - incomingStock;
    let rawReorderQty = Math.max(0, netNeeded);

    if (params.packSize && params.packSize > 0 && rawReorderQty > 0) {
      const pack = params.packSize;
      rawReorderQty = Math.ceil(rawReorderQty / pack) * pack;
    }

    const reorderQuantity = roundDecimal(rawReorderQty);
    const isReorderNeeded = reorderQuantity > 0;

    let explanation = '';
    if (isReorderNeeded) {
      explanation = `बिक्री इतिहास अभी कम है; आपकी सेट की गई न्यूनतम सीमा (${minStock} ${params.unit}) को पूरा करने के लिए ${reorderQuantity} ${params.unit} की सिफारिश है।`;
    } else {
      explanation = `स्टॉक न्यूनतम सीमा (${minStock} ${params.unit}) से अधिक है। अभी रीऑर्डर की ज़रूरत नहीं है।`;
    }

    return {
      targetStock,
      reorderQuantity,
      basis: 'min_stock_fallback',
      explanation,
      isReorderNeeded,
    };
  }

  // 3. Insufficient data basis
  return {
    targetStock: 0,
    reorderQuantity: 0,
    basis: 'insufficient_data',
    explanation: 'रीऑर्डर की गणना के लिए बिक्री इतिहास या न्यूनतम सीमा दर्ज नहीं है (Not enough data to calculate reorder).',
    isReorderNeeded: false,
  };
}

