import { recognize } from 'tesseract.js';
import { validateInvoiceImageFile } from './imageValidator';
import { parseInvoiceText } from './invoiceParser';
import { matchInvoiceItems } from './productMatcher';
import { Product } from '@/domain/types';
import { OCRScanResult } from '../types';

export interface OCRProgressCallback {
  (progressPercent: number, statusText: string): void;
}

/**
 * Scans an invoice or stock-list image file using Tesseract.js (in-browser WebAssembly).
 * Normalizes detected line items and conservatively matches against inventory.
 */
export async function scanInvoiceImage(
  file: File,
  existingProducts: Product[],
  onProgress?: OCRProgressCallback
): Promise<OCRScanResult> {
  // 1. Pre-validation
  const validation = validateInvoiceImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'अमान्य छवि फ़ाइल');
  }

  onProgress?.(10, 'छवि लोड हो रही है (Loading image)...');

  try {
    // 2. Perform OCR using Tesseract WebAssembly worker
    const { data } = await recognize(file, 'eng', {
      logger: (msg) => {
        if (msg.status === 'recognizing text') {
          const pct = Math.round((msg.progress || 0) * 80) + 10;
          onProgress?.(pct, `टेक्स्ट पहचान जारी (${pct}%)...`);
        }
      },
    });

    const rawText = data.text || '';
    onProgress?.(95, 'आइटम और मात्रा की जांच हो रही है (Matching items)...');

    // 3. Parse lines into structured items
    const rawParsedLines = parseInvoiceText(rawText);

    // 4. Conservatively match against active store products
    const items = matchInvoiceItems(rawParsedLines, existingProducts);

    onProgress?.(100, 'स्कैन पूर्ण (Scan complete)');

    const warnings: string[] = [];
    if (items.length === 0) {
      warnings.push('छवि से कोई स्पष्ट सामान या मात्रा नहीं पहचानी जा सकी। कृपया मैन्युअल रूप से जोड़ें या स्पष्ट फ़ोटो लें।');
    }

    const uncertainCount = items.filter((i) => i.status === 'uncertain').length;
    if (uncertainCount > 0) {
      warnings.push(`${uncertainCount} आइटम की पहचान अनिश्चित है, कृपया अनुमोदन से पहले जांच लें।`);
    }

    return {
      success: true,
      rawText,
      items,
      warnings,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'OCR स्कैनिंग में विफल';
    throw new Error(`OCR त्रुटि: ${errorMsg}`);
  }
}

