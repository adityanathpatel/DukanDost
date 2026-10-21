import { ProductUnit } from './types';

/**
 * Precision decimal rounding to eliminate floating-point drift (e.g. 0.1 + 0.2 = 0.30000000000000004)
 * Uses 4 decimal places (accurate to 0.1 gram or 0.1 ml).
 */
export const DEFAULT_PRECISION = 4;

export function roundDecimal(value: number, decimals: number = DEFAULT_PRECISION): number {
  if (!Number.isFinite(value)) {
    throw new Error('अमान्य संख्या (Cannot round a non-finite number)');
  }
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Validates that a quantity is a valid, non-negative, finite number.
 */
export function validateQuantity(quantity: unknown, fieldName: string = 'मात्रा (Quantity)'): number {
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || !Number.isFinite(quantity)) {
    throw new Error(`${fieldName} अमान्य है। कृपया सही संख्या दर्ज करें (${fieldName} must be a valid finite number)`);
  }
  if (quantity < 0) {
    throw new Error(`${fieldName} शून्य से कम (negative) नहीं हो सकती (${fieldName} cannot be negative)`);
  }
  return roundDecimal(quantity);
}

/**
 * Categorize units into compatibility groups.
 * Mass: kg, g
 * Volume: liter, ml
 * Count: piece, dozen, packet, bottle, box
 */
export type UnitCategory = 'mass' | 'volume' | 'discrete';

export function getUnitCategory(unit: ProductUnit): UnitCategory {
  switch (unit) {
    case 'kg':
    case 'g':
    case 'half_kg':
      return 'mass';
    case 'liter':
    case 'ml':
      return 'volume';
    case 'piece':
    case 'dozen':
    case 'packet':
    case 'bottle':
    case 'box':
      return 'discrete';
  }
}

/**
 * Checks if two units are compatible for direct mathematical operations or conversion.
 */
export function areUnitsCompatible(fromUnit: ProductUnit, toUnit: ProductUnit): boolean {
  if (fromUnit === toUnit) return true;
  
  const fromCat = getUnitCategory(fromUnit);
  const toCat = getUnitCategory(toUnit);

  if (fromCat !== toCat) return false;

  // Mass units (kg, g, half_kg) are mutually compatible
  if (fromCat === 'mass') return true;

  // Volume units (liter, ml) are mutually compatible
  if (fromCat === 'volume') return true;

  // Discrete units: only piece <-> dozen can convert directly.
  // Packets, bottles, boxes cannot be assumed to convert to each other or to pieces.
  if ((fromUnit === 'piece' && toUnit === 'dozen') || (fromUnit === 'dozen' && toUnit === 'piece')) {
    return true;
  }

  return false;
}

/**
 * Converts a quantity from one unit to another compatible unit.
 * Throws an explicit error if units are incompatible.
 */
export function convertUnit(quantity: number, fromUnit: ProductUnit, toUnit: ProductUnit): number {
  const validQty = validateQuantity(quantity);

  if (fromUnit === toUnit) {
    return validQty;
  }

  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(
      `इकाई असंगत है: ${fromUnit} को ${toUnit} में नहीं बदला जा सकता (Cannot convert incompatible units: ${fromUnit} to ${toUnit})`
    );
  }

  // Mass conversions (base: kg)
  if (getUnitCategory(fromUnit) === 'mass') {
    // Normalize to kg first
    let qtyInKg = 0;
    if (fromUnit === 'kg') qtyInKg = validQty;
    else if (fromUnit === 'g') qtyInKg = validQty / 1000;
    else if (fromUnit === 'half_kg') qtyInKg = validQty * 0.5;

    // Convert from kg to target unit
    if (toUnit === 'kg') return roundDecimal(qtyInKg);
    if (toUnit === 'g') return roundDecimal(qtyInKg * 1000);
    if (toUnit === 'half_kg') return roundDecimal(qtyInKg / 0.5);
  }

  // Volume conversions (base: liter)
  if (getUnitCategory(fromUnit) === 'volume') {
    // Normalize to liter
    const qtyInLiter = fromUnit === 'liter' ? validQty : validQty / 1000;

    if (toUnit === 'liter') return roundDecimal(qtyInLiter);
    if (toUnit === 'ml') return roundDecimal(qtyInLiter * 1000);
  }

  // Count conversions (piece <-> dozen)
  if (fromUnit === 'piece' && toUnit === 'dozen') {
    return roundDecimal(validQty / 12);
  }
  if (fromUnit === 'dozen' && toUnit === 'piece') {
    return roundDecimal(validQty * 12);
  }

  throw new Error(`रूपांतरण समर्थित नहीं है: ${fromUnit} to ${toUnit}`);
}

/**
 * Adds two quantities safely, converting unit2 into unit1's unit if compatible.
 */
export function addQuantities(
  qty1: number,
  unit1: ProductUnit,
  qty2: number,
  unit2: ProductUnit
): number {
  const v1 = validateQuantity(qty1, 'मात्रा 1');
  const v2 = validateQuantity(qty2, 'मात्रा 2');

  if (unit1 === unit2) {
    return roundDecimal(v1 + v2);
  }

  const convertedV2 = convertUnit(v2, unit2, unit1);
  return roundDecimal(v1 + convertedV2);
}

/**
 * Subtracts qty2 from qty1 safely, converting unit2 into unit1's unit if compatible.
 */
export function subtractQuantities(
  qty1: number,
  unit1: ProductUnit,
  qty2: number,
  unit2: ProductUnit
): number {
  const v1 = validateQuantity(qty1, 'मात्रा 1');
  const v2 = validateQuantity(qty2, 'मात्रा 2');

  if (unit1 === unit2) {
    return roundDecimal(v1 - v2);
  }

  const convertedV2 = convertUnit(v2, unit2, unit1);
  return roundDecimal(v1 - convertedV2);
}

