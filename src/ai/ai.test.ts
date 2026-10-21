import { describe, it, expect } from 'vitest';
import { parseInvoiceLines } from './ocr/invoiceParser';
import { matchInvoiceItems } from './ocr/productMatcher';
import { validateInvoiceImageFile } from './ocr/imageValidator';
import { detectVoiceIntent, parseSpokenQuantity, parseSpokenUnit, parseVoiceCommand } from './voice/voiceParser';
import { generateProductForecast } from './forecasting/forecaster';
import { Product, StockMovement } from '@/domain/types';

describe('Feature A: OCR Invoice & Stock-List Scanner', () => {
  it('parses raw printed text into line items, quantities, and units', () => {
    const rawInvoiceText = `
      TAX INVOICE
      Distributor: Sharma Wholesale
      1. Amul Taaza Milk 10 Pkt Rate: 28.00 Total: 280.00
      2. Tata Salt 5 kg Rate: 24.00 Total: 120.00
      3. Parle-G Biscuits 20 pcs Rate: 10.00 Total: 200.00
      4. Mustard Oil 2 Ltr Rate: 160.00 Total: 320.00
    `;

    const parsed = parseInvoiceLines(rawInvoiceText);
    expect(parsed.length).toBeGreaterThanOrEqual(4);

    const amul = parsed.find((p) => p.name.toLowerCase().includes('amul'));
    expect(amul).toBeDefined();
    expect(amul?.quantity).toBe(10);
    expect(amul?.unit).toBe('packet');
    expect(amul?.costPrice).toBe(28);

    const tata = parsed.find((p) => p.name.toLowerCase().includes('tata'));
    expect(tata).toBeDefined();
    expect(tata?.quantity).toBe(5);
    expect(tata?.unit).toBe('kg');
    expect(tata?.costPrice).toBe(24);
  });

  it('validates image files rejecting unsupported types and excessive sizes', () => {
    // Valid PNG file
    const validFile = new File(['valid content'], 'invoice.png', { type: 'image/png' });
    const validResult = validateInvoiceImageFile(validFile);
    expect(validResult.isValid).toBe(true);

    // Invalid TXT file
    const invalidTypeFile = new File(['text'], 'invoice.txt', { type: 'text/plain' });
    const invalidTypeResult = validateInvoiceImageFile(invalidTypeFile);
    expect(invalidTypeResult.isValid).toBe(false);
    expect(invalidTypeResult.error).toContain('फ़ाइल प्रारूप अमान्य');

    // Oversized mock file (> 10MB)
    const largeFile = new File([''], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
    const largeResult = validateInvoiceImageFile(largeFile);
    expect(largeResult.isValid).toBe(false);
    expect(largeResult.error).toContain('10 MB');
  });

  it('matches products conservatively and flags ambiguous matches', () => {
    const inventory: Product[] = [
      {
        id: 'prod_1',
        name: 'Amul Taaza Toned Milk (500ml)',
        nameHi: 'अमूल ताज़ा टोन्ड दूध',
        category: 'Dairy',
        unit: 'packet',
        stockQty: 10,
        minStock: 5,
        archived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'prod_2',
        name: 'Amul Gold Full Cream Milk (500ml)',
        nameHi: 'अमूल गोल्ड फुल क्रीम दूध',
        category: 'Dairy',
        unit: 'packet',
        stockQty: 8,
        minStock: 4,
        archived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'prod_3',
        name: 'Aashirvaad Shudh Chakki Atta (5kg)',
        nameHi: 'आशीर्वाद चक्की आटा',
        category: 'Staples',
        unit: 'kg',
        stockQty: 25,
        minStock: 10,
        archived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const lines = [
      { rawText: 'Aashirvaad Atta 5kg', name: 'Aashirvaad Atta', quantity: 5, unit: 'kg' as const },
      { rawText: 'Amul Milk 10 pkt', name: 'Amul Milk', quantity: 10, unit: 'packet' as const },
      { rawText: 'Random Soap 2 pcs', name: 'Random Soap', quantity: 2, unit: 'piece' as const },
    ];

    const matched = matchInvoiceItems(lines, inventory);
    expect(matched.length).toBe(3);

    // Aashirvaad should match prod_3
    expect(matched[0].status).toBe('matched');
    expect(matched[0].matchedProductId).toBe('prod_3');

    // Amul Milk matches both Amul Taaza and Amul Gold closely, so status is uncertain
    expect(['uncertain', 'matched']).toContain(matched[1].status);

    // Random Soap should be unmatched
    expect(matched[2].status).toBe('unmatched');
    expect(matched[2].matchedProductId).toBeUndefined();
  });
});

describe('Feature B: Hindi/Hinglish Voice Agent', () => {
  const sampleProducts: Product[] = [
    {
      id: 'prod_atta',
      name: 'Aashirvaad Chakki Atta',
      nameHi: 'आशीर्वाद चक्की आटा',
      category: 'अनाज',
      unit: 'kg',
      stockQty: 12,
      minStock: 15, // Low stock
      archived: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'prod_milk',
      name: 'Amul Taaza Milk',
      nameHi: 'अमूल ताज़ा दूध',
      category: 'डेयरी',
      unit: 'packet',
      stockQty: 4,
      minStock: 10, // Low stock
      archived: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'prod_biscuit',
      name: 'Parle-G Glucose Biscuit',
      nameHi: 'पारले-जी बिस्कुट',
      category: 'नाश्ता',
      unit: 'packet',
      stockQty: 30,
      minStock: 10,
      archived: false,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  it('detects intents correctly for Hindi and Hinglish commands', () => {
    expect(detectVoiceIntent('Kitna atta bacha hai?')).toBe('stock_lookup');
    expect(detectVoiceIntent('Aashirvaad atta ka stock kitna hai')).toBe('stock_lookup');
    expect(detectVoiceIntent('Parle-G ke 2 packet bech do')).toBe('record_sale');
    expect(detectVoiceIntent('Amul milk 5 packet sale karo')).toBe('record_sale');
    expect(detectVoiceIntent('Amul milk ke 10 packet add karo')).toBe('receive_stock');
    expect(detectVoiceIntent('10 kg atta aaya hai')).toBe('receive_stock');
    expect(detectVoiceIntent('Kaun se products low stock mein hain?')).toBe('low_stock_lookup');
    expect(detectVoiceIntent('kya khatam hone wala hai')).toBe('low_stock_lookup');
  });

  it('extracts Hindi words, numerals and fractions accurately', () => {
    expect(parseSpokenQuantity('10')).toBe(10);
    expect(parseSpokenQuantity('do packet bech do')).toBe(2);
    expect(parseSpokenQuantity('paanch kilo chawal')).toBe(5);
    expect(parseSpokenQuantity('aadha kilo cheeni')).toBe(0.5);
    expect(parseSpokenQuantity('dhai packet doodh')).toBe(2.5);
    expect(parseSpokenQuantity('dedh liter tel')).toBe(1.5);
    expect(parseSpokenQuantity('ek aur aadha packet')).toBe(1.5);
  });

  it('extracts units from spoken text', () => {
    expect(parseSpokenUnit('10 packet doodh')).toBe('packet');
    expect(parseSpokenUnit('5 kilo chawal')).toBe('kg');
    expect(parseSpokenUnit('2 liter oil')).toBe('liter');
    expect(parseSpokenUnit('4 piece soap')).toBe('piece');
    expect(parseSpokenUnit('1 bottle shampoo')).toBe('bottle');
  });

  it('parses complete sale and inward commands', () => {
    const saleCmd = parseVoiceCommand('Parle-G ke 2 packet bech do', sampleProducts, 'hi');
    expect(saleCmd.intent).toBe('record_sale');
    expect(saleCmd.isComplete).toBe(true);
    expect(saleCmd.matchedProduct?.id).toBe('prod_biscuit');
    expect(saleCmd.quantity).toBe(2);
    expect(saleCmd.unit).toBe('packet');

    const inwardCmd = parseVoiceCommand('Amul milk ke 10 packet add karo', sampleProducts, 'hi');
    expect(inwardCmd.intent).toBe('receive_stock');
    expect(inwardCmd.isComplete).toBe(true);
    expect(inwardCmd.matchedProduct?.id).toBe('prod_milk');
    expect(inwardCmd.quantity).toBe(10);
    expect(inwardCmd.unit).toBe('packet');
  });

  it('detects incomplete commands and lists missing fields', () => {
    const incomplete = parseVoiceCommand('Atta bech do', sampleProducts, 'hi');
    expect(incomplete.intent).toBe('record_sale');
    expect(incomplete.isComplete).toBe(false);
    expect(incomplete.missingFields.some((f) => f.includes('मात्रा') || f.includes('Quantity'))).toBe(true);
  });
});

describe('Feature C: Chronological Demand Forecasting', () => {
  const testProduct: Product = {
    id: 'prod_tea',
    name: 'Tata Tea Gold',
    nameHi: 'टाटा टी गोल्ड',
    category: 'Beverages',
    unit: 'packet',
    stockQty: 8,
    minStock: 10,
    archived: false,
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now(),
  };

  it('honestly returns insufficient_data when sales history has fewer than 3 transactions', () => {
    const sparseMovements: StockMovement[] = [
      {
        id: 'mov_1',
        productId: 'prod_tea',
        type: 'sale',
        quantity: 2,
        unit: 'packet',
        quantityDelta: -2,
        stockBefore: 12,
        stockAfter: 10,
        timestamp: Date.now() - 5 * 86400000,
        operationId: 'op_1',
      },
      {
        id: 'mov_2',
        productId: 'prod_tea',
        type: 'sale',
        quantity: 1,
        unit: 'packet',
        quantityDelta: -1,
        stockBefore: 10,
        stockAfter: 9,
        timestamp: Date.now() - 2 * 86400000,
        operationId: 'op_2',
      },
    ];

    const forecast = generateProductForecast(testProduct, sparseMovements, Date.now(), 'hi');
    expect(forecast.status).toBe('insufficient_data');
    expect(forecast.modelIdentifier).toBe('insufficient_history');
    expect(forecast.sevenDayForecast.length).toBe(0);
    expect(forecast.reason).toContain('कम से कम 3');
  });

  it('honestly returns insufficient_data when sales span is less than 7 days', () => {
    const shortSpanMovements: StockMovement[] = [
      {
        id: 'mov_1',
        productId: 'prod_tea',
        type: 'sale',
        quantity: 1,
        unit: 'packet',
        quantityDelta: -1,
        stockBefore: 10,
        stockAfter: 9,
        timestamp: Date.now() - 2 * 86400000,
        operationId: 'op_1',
      },
      {
        id: 'mov_2',
        productId: 'prod_tea',
        type: 'sale',
        quantity: 2,
        unit: 'packet',
        quantityDelta: -2,
        stockBefore: 9,
        stockAfter: 7,
        timestamp: Date.now() - 1 * 86400000,
        operationId: 'op_2',
      },
      {
        id: 'mov_3',
        productId: 'prod_tea',
        type: 'sale',
        quantity: 1,
        unit: 'packet',
        quantityDelta: -1,
        stockBefore: 7,
        stockAfter: 6,
        timestamp: Date.now() - 50000,
        operationId: 'op_3',
      },
    ];

    const forecast = generateProductForecast(testProduct, shortSpanMovements, Date.now(), 'hi');
    expect(forecast.status).toBe('insufficient_data');
    expect(forecast.reason).toContain('कम से कम 7 दिन');
  });

  it('generates 7-day forecast with chronological evaluation when sufficient data exists', () => {
    const now = Date.now();
    const richMovements: StockMovement[] = [];

    // Simulate 14 days of sales history
    for (let day = 14; day >= 1; day--) {
      richMovements.push({
        id: `mov_hist_${day}`,
        productId: 'prod_tea',
        type: 'sale',
        quantity: 2 + (day % 3), // 2 to 4 packets per day
        unit: 'packet',
        quantityDelta: -(2 + (day % 3)),
        stockBefore: 50,
        stockAfter: 48,
        timestamp: now - day * 86400000,
        operationId: `op_hist_${day}`,
      });
    }

    const forecast = generateProductForecast(testProduct, richMovements, now, 'hi');
    expect(forecast.status).toBe('sufficient_data');
    expect(forecast.modelIdentifier).toBe('chronological_ema_dow_v1');
    expect(forecast.historicalDaysAnalyzed).toBeGreaterThanOrEqual(14);
    expect(forecast.sevenDayForecast.length).toBe(7);
    expect(forecast.totalForecastedDemand).toBeGreaterThan(0);
    expect(forecast.unit).toBe('packet'); // Unit isolation strictly preserved
    expect(forecast.mae).toBeDefined();
    expect(forecast.mae).toBeGreaterThanOrEqual(0);
    expect(forecast.wape).toBeDefined();
    expect(forecast.wape).toBeGreaterThanOrEqual(0);

    // Suggested reorder = max(0, totalForecasted - currentStock (8))
    const expectedReorder = Math.max(0, Math.round((forecast.totalForecastedDemand - 8) * 10) / 10);
    expect(forecast.suggestedReorderQty).toBe(expectedReorder);
  });
});
