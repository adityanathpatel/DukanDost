import { ProductUnit } from '@/domain/types';

export interface RawParsedLine {
  rawText: string;
  name: string;
  quantity: number | null;
  unit: ProductUnit;
  costPrice?: number;
}

const UNIT_SYNONYMS: Record<string, ProductUnit> = {
  // Packets
  pkt: 'packet',
  packet: 'packet',
  packets: 'packet',
  pkts: 'packet',
  pack: 'packet',
  packs: 'packet',

  // Pieces
  pc: 'piece',
  pcs: 'piece',
  piece: 'piece',
  pieces: 'piece',
  nag: 'piece',
  no: 'piece',
  nos: 'piece',

  // Weight
  kg: 'kg',
  kgs: 'kg',
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  gm: 'g',
  g: 'g',
  gram: 'g',
  grams: 'g',

  // Volume
  ltr: 'liter',
  liter: 'liter',
  liters: 'liter',
  litre: 'liter',
  litres: 'liter',
  l: 'liter',
  ml: 'ml',

  // Containers
  btl: 'bottle',
  bottle: 'bottle',
  bottles: 'bottle',
  box: 'box',
  boxes: 'box',
  ctn: 'box',
  carton: 'box',
  dz: 'dozen',
  doz: 'dozen',
  dozen: 'dozen',
};

const IGNORED_LINE_PATTERNS = [
  /^(tax\s+)?invoice/i,
  /^bill\s+no/i,
  /^cash\s+memo/i,
  /^challan/i,
  /^gstin/i,
  /^date/i,
  /^total/i,
  /^grand\s+total/i,
  /^sub\s*total/i,
  /^s(\.|\s*)no/i,
  /^item\s+description/i,
  /^particulars/i,
  /^amount/i,
  /^signature/i,
  /^thank\s+you/i,
  /^e\s*&\s*o\s*e/i,
];

export function isHeaderOrFooterLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return true;
  return IGNORED_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Normalizes and extracts structured candidate line items from raw OCR text.
 */
export function parseInvoiceText(rawText: string): RawParsedLine[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsedItems: RawParsedLine[] = [];

  for (const line of lines) {
    if (isHeaderOrFooterLine(line)) continue;

    // Clean leading index numbers like "1.", "1 -", "01"
    const cleanedLine = line.replace(/^\d+[.)\-\s]\s*/, '').trim();
    if (!cleanedLine) continue;

    // Regex to match quantity and optional unit: e.g. "24 pkt", "10 kg", "12 btl", "x 5"
    // Also captures optional price like "@ 24", "Rs 240", "₹240"
    const parsed = parseLinePattern(cleanedLine);
    if (parsed) {
      parsedItems.push(parsed);
    }
  }

  return parsedItems;
}

function parseLinePattern(line: string): RawParsedLine | null {
  // Try pattern 1: Product Name [Quantity] [Unit] [Price/Amount]
  // e.g. "Tata Salt 1kg 24 pkt 24.50" or "Maggi Noodles 70g - 12 pcs"
  const tokens = line.split(/[\s|,|;]+/).filter(Boolean);
  if (tokens.length < 2) return null;

  let quantity: number | null = null;
  let unit: ProductUnit = 'packet';
  let price: number | undefined = undefined;
  const nameTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].toLowerCase().replace(/[^\w.]/g, '');
    const num = parseFloat(token);

    // Check if token is a recognized unit
    if (UNIT_SYNONYMS[token]) {
      unit = UNIT_SYNONYMS[token];
      // Often the preceding token was the quantity
      if (quantity === null && nameTokens.length > 0) {
        const lastToken = nameTokens[nameTokens.length - 1];
        const lastNum = parseFloat(lastToken);
        if (!Number.isNaN(lastNum) && lastNum > 0) {
          quantity = lastNum;
          nameTokens.pop();
        }
      }
      continue;
    }

    // Check if token represents price e.g. "Rate: 28.00", "Rate 28", "@120", "rs.50"
    const lowerToken = tokens[i].toLowerCase();
    if (lowerToken.startsWith('rate') || lowerToken.startsWith('price')) {
      const inlineVal = parseFloat(tokens[i].replace(/[^\d.]/g, ''));
      if (!Number.isNaN(inlineVal) && inlineVal > 0) {
        price = inlineVal;
        continue;
      }
      const nextVal = parseFloat(tokens[i + 1]?.replace(/[^\d.]/g, ''));
      if (!Number.isNaN(nextVal) && nextVal > 0) {
        price = nextVal;
        i++;
        continue;
      }
    }

    if (tokens[i].startsWith('@') || lowerToken.startsWith('rs') || tokens[i].startsWith('₹')) {
      const cleanPrice = parseFloat(tokens[i].replace(/[^\d.]/g, ''));
      if (!Number.isNaN(cleanPrice) && cleanPrice > 0) {
        price = cleanPrice;
        continue;
      }
    }

    // Check for quantity number in middle/tail of line
    if (!Number.isNaN(num) && num > 0 && quantity === null && i > 0) {
      // Look ahead to see if next token is a unit
      const nextToken = tokens[i + 1]?.toLowerCase().replace(/[^\w]/g, '');
      if (nextToken && UNIT_SYNONYMS[nextToken]) {
        quantity = num;
        unit = UNIT_SYNONYMS[nextToken];
        i++; // skip next token
        continue;
      }
    }

    nameTokens.push(tokens[i]);
  }

  // If quantity still not found, check the last numerical token
  if (quantity === null) {
    for (let i = nameTokens.length - 1; i >= 1; i--) {
      const val = parseFloat(nameTokens[i].replace(/[^\d.]/g, ''));
      if (!Number.isNaN(val) && val > 0 && val < 10000) {
        quantity = val;
        nameTokens.splice(i, 1);
        break;
      }
    }
  }

  const name = nameTokens.join(' ').replace(/[@\-|=]/g, '').trim();
  if (!name || name.length < 2) return null;

  return {
    rawText: line,
    name,
    quantity,
    unit,
    costPrice: price,
  };
}

export const parseInvoiceLines = parseInvoiceText;
