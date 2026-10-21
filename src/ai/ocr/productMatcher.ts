import { Product } from '@/domain/types';
import { RawParsedLine } from './invoiceParser';
import { ParsedInvoiceItem, MatchStatus } from '../types';
import { generateId } from '@/data/productRepository';

/**
 * Calculates token-based Jaccard similarity and character Levenshtein similarity.
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Substring containment check
  if (s1.includes(s2) || s2.includes(s1)) {
    const lenRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    if (lenRatio >= 0.6) return Math.max(0.8, lenRatio);
  }

  // Token overlap (Jaccard similarity + Overlap coefficient on alphanumeric words)
  const tokens1 = new Set(s1.split(/[\s\-_,.]+/).filter((t) => t.length > 1));
  const tokens2 = new Set(s2.split(/[\s\-_,.]+/).filter((t) => t.length > 1));

  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersectionCount++;
  }

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionCount === 0 ? 0 : intersectionCount / unionCount;
  const overlap = Math.min(tokens1.size, tokens2.size) === 0 ? 0 : intersectionCount / Math.min(tokens1.size, tokens2.size);

  // Blend: if user query tokens are fully or mostly contained in product title, boost score
  const score = Math.max(jaccard, 0.35 * jaccard + 0.65 * overlap);
  return Math.min(1.0, score);
}

/**
 * Matches parsed invoice lines conservatively against the active product inventory.
 */
export function matchInvoiceItems(
  rawLines: RawParsedLine[],
  existingProducts: Product[]
): ParsedInvoiceItem[] {
  return rawLines.map((line) => {
    let bestMatch: Product | null = null;
    let highestScore = 0;
    let ambiguousCount = 0;

    for (const prod of existingProducts) {
      const engScore = calculateStringSimilarity(line.name, prod.name);
      const hiScore = prod.nameHi ? calculateStringSimilarity(line.name, prod.nameHi) : 0;
      const score = Math.max(engScore, hiScore);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
        ambiguousCount = 1;
      } else if (Math.abs(score - highestScore) < 0.05 && score >= 0.6) {
        // Multiple candidate products with nearly identical match scores
        ambiguousCount++;
      }
    }

    let status: MatchStatus = 'unmatched';
    let matchedId: string | undefined = undefined;
    let matchedName: string | undefined = undefined;

    // Conservative matching rules
    if (highestScore >= 0.75 && ambiguousCount === 1 && bestMatch) {
      status = 'matched';
      matchedId = bestMatch.id;
      matchedName = bestMatch.name;
    } else if (highestScore >= 0.45 && bestMatch) {
      // Mark as uncertain if score is intermediate or multiple items matched closely
      status = 'uncertain';
      matchedId = bestMatch.id;
      matchedName = bestMatch.name;
    }

    // Default quantity fallback if missing
    const quantity = line.quantity !== null && line.quantity > 0 ? line.quantity : 1;
    const isApproved = status === 'matched' && line.quantity !== null;

    let validationError: string | undefined = undefined;
    if (line.quantity === null) {
      validationError = 'मात्रा नहीं मिली (Quantity missing, please review)';
    }

    return {
      id: generateId('ocr_row'),
      rawText: line.rawText,
      name: matchedName || line.name,
      quantity,
      unit: bestMatch?.unit || line.unit,
      costPrice: line.costPrice || bestMatch?.costPrice,
      matchedProductId: matchedId,
      matchedProductName: matchedName,
      confidence: Math.round(highestScore * 100) / 100,
      status,
      isApproved,
      validationError,
    };
  });
}
