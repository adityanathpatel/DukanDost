import { Product, ProductUnit } from '@/domain/types';
import { calculateStringSimilarity } from '../ocr/productMatcher';
import { ParsedVoiceCommand, VoiceIntentType } from '../types';

/**
 * Hindi and English numeral dictionary
 */
const NUMBER_WORDS: Record<string, number> = {
  // Hindi Numerals
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  panch: 5,
  paanch: 5,
  che: 6,
  chhe: 6,
  chhah: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnees: 19,
  bees: 20,
  ikkees: 21,
  baees: 22,
  tayees: 23,
  chaubees: 24,
  pachees: 25,
  chhabees: 26,
  sattaees: 27,
  athaaees: 28,
  untees: 29,
  tees: 30,
  paintis: 35,
  chalis: 40,
  pentalis: 45,
  pachas: 50,
  pachaas: 50,
  sau: 100,

  // Hindi Fractions
  aadha: 0.5,
  adha: 0.5,
  half: 0.5,
  paav: 0.25,
  pao: 0.25,
  quarter: 0.25,
  dedh: 1.5,
  derh: 1.5,
  dhai: 2.5,
  dhaai: 2.5,
  sawa: 1.25,
  sawai: 1.25,
  paune: 0.75,
  paun: 0.75,

  // English words
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  fifty: 50,
  hundred: 100,

  // Hindi Devanagari digits
  '१': 1,
  '२': 2,
  '३': 3,
  '४': 4,
  '५': 5,
  '६': 6,
  '७': 7,
  '८': 8,
  '९': 9,
  '१०': 10,
};

/**
 * Normalizes unit strings from speech
 */
export function parseSpokenUnit(text: string): ProductUnit | undefined {
  // Normalize brand name "parle-g" so single letter 'g' is never mistakenly parsed as grams
  const lower = text.toLowerCase().replace(/parle[-\s]?g\b/gi, 'parle_biscuit');

  if (/\b(?:packet|packets|pkt|pkts|pack|पैकेट|पैक)\b/i.test(lower)) return 'packet';
  if (/\b(?:piece|pieces|pc|pcs|item|items|पीस|नग)\b/i.test(lower)) return 'piece';
  if (/\b(?:bottle|bottles|btl|बोतल)\b/i.test(lower)) return 'bottle';
  if (/\b(?:box|boxes|डिब्बा|पेटी)\b/i.test(lower)) return 'box';
  if (/\b(?:dozen|darjan|दर्जन)\b/i.test(lower)) return 'dozen';
  if (/\b(?:kg|kilo|kilos|kilogram|किलो|किलोग्राम)\b/i.test(lower)) return 'kg';
  if (/\b(?:liter|litre|liters|litres|ltr|लीटर)\b/i.test(lower)) return 'liter';
  if (/\b(?:ml|मिलीलीटर)\b/i.test(lower)) return 'ml';
  if (/\b(?:gm|gms|gram|grams|ग्राम)\b/i.test(lower)) return 'g';
  if (/\b(?:\d+\s*)g\b/i.test(lower)) return 'g';
  return undefined;
}

/**
 * Extracts quantity from spoken text supporting digits, Hindi words, and fractions.
 */
export function parseSpokenQuantity(text: string): number | undefined {
  let lower = text.toLowerCase();

  // Guard against Hindi verbal suffix "do" (e.g. "bech do", "dal do", "de do", "kar do")
  // Remove verbal suffix "do" so it is not mistaken for the numeral 2
  lower = lower.replace(/\b(bech|dal|de|kar)\s+do\b/gi, '$1');

  // 1. Direct standard decimal or integer number (e.g. "10", "2.5")
  const numMatch = lower.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // 2. Multi-word phrases like "ek aur aadha" -> 1.5, "do aur aadha" -> 2.5
  const compoundMatch = lower.match(/\b(ek|do|teen|char|paanch)\s+(?:aur|and)\s+(aadha|adha|half)\b/);
  if (compoundMatch) {
    const base = NUMBER_WORDS[compoundMatch[1]] || 0;
    return base + 0.5;
  }

  // 3. Single number words
  const tokens = lower.split(/[\s,]+/);
  for (const token of tokens) {
    if (NUMBER_WORDS[token] !== undefined) {
      return NUMBER_WORDS[token];
    }
  }

  return undefined;
}

/**
 * Determines intent from voice transcript
 */
export function detectVoiceIntent(rawQuery: string): VoiceIntentType {
  const q = rawQuery.toLowerCase();

  // 1. Low stock lookup
  if (
    /(?:low\s*stock|khatam|out\s*of\s*stock|kam\s*stock|kam\s*hai|kam\s*pada|kam\s*bache|reorder|order\s*karna)/i.test(q)
  ) {
    return 'low_stock_lookup';
  }

  // 2. Stock lookup (e.g. "kitna bacha hai", "kitna hai", "check stock")
  if (
    /(?:kitna|kitni|kitne|bacha|bachi|bache|how\s*much|stock\s*kitna|kya\s*stock|check\s*stock|batao|dekho)/i.test(q) &&
    !/(?:bech|sale|sold|add|aaya|inward|dal)/i.test(q)
  ) {
    return 'stock_lookup';
  }

  // 3. Record Sale (e.g. "bech do", "sale karo", "sold", "nikalo")
  if (
    /(?:bech|becho|becha|bika|bik\s*gaya|sale|sold|sell|nikalo|nikal|de\s*do|dedo|diya)/i.test(q)
  ) {
    return 'record_sale';
  }

  // 4. Receive Stock (e.g. "add karo", "aaya hai", "inward", "receive", "dala", "dal do")
  if (
    /(?:add|aaya|aayi|aaye|aaya\s*hai|aaya\s*tha|inward|receive|dala|dalo|dal\s*do|le\s*aao|stock\s*in|mangwaya|plus)/i.test(q)
  ) {
    return 'receive_stock';
  }

  return 'unknown';
}

/**
 * Cleans tokens to isolate candidate product name
 */
export function extractCandidateProductName(rawQuery: string): string {
  let cleaned = rawQuery.toLowerCase();

  // Remove punctuation
  cleaned = cleaned.replace(/[?.!,"'’;:()-]/g, ' ');

  // Remove common intent verbs and trigger keywords
  const removeWords = [
    'add', 'karo', 'kar', 'do', 'dalo', 'dala', 'dal', 'aaya', 'aayi', 'aaye', 'hai', 'hain', 'tha',
    'bech', 'becho', 'becha', 'bika', 'bik', 'gaya', 'sale', 'sold', 'sell', 'nikalo', 'nikal',
    'kitna', 'kitni', 'kitne', 'bacha', 'bachi', 'bache', 'batao', 'dekho', 'check', 'stock',
    'low', 'out', 'of', 'khatam', 'hone', 'wala', 'kam', 'mein', 'ko', 'ka', 'ki', 'ke', 'se',
    'please', 'kripya', 'aur', 'and', 'mera', 'meri', 'dukaan', 'bhi', 'kya', 'kaun'
  ];

  for (const word of removeWords) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(reg, ' ');
  }

  // Remove numbers and fraction words
  for (const numWord of Object.keys(NUMBER_WORDS)) {
    const reg = new RegExp(`\\b${numWord}\\b`, 'gi');
    cleaned = cleaned.replace(reg, ' ');
  }
  cleaned = cleaned.replace(/\b\d+(?:\.\d+)?\b/g, ' ');

  // Remove unit words
  const unitWords = ['kg', 'kilo', 'kilos', 'gram', 'grams', 'g', 'gm', 'liter', 'liters', 'litre', 'ltr', 'ml', 'packet', 'packets', 'pkt', 'piece', 'pieces', 'pc', 'pcs', 'bottle', 'bottles', 'box', 'boxes', 'dozen'];
  for (const u of unitWords) {
    const reg = new RegExp(`\\b${u}\\b`, 'gi');
    cleaned = cleaned.replace(reg, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Parses spoken command against current store products
 */
export function parseVoiceCommand(
  rawQuery: string,
  existingProducts: Product[],
  language: 'hi' | 'en' = 'hi'
): ParsedVoiceCommand {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return {
      intent: 'unknown',
      rawQuery: '',
      isComplete: false,
      missingFields: [language === 'hi' ? 'आवाज़ या निर्देश' : 'Voice command'],
      confidence: 0,
      actionDescription: language === 'hi' ? 'कृपया कोई निर्देश बोलें या लिखें' : 'Please speak or type a command',
    };
  }

  const intent = detectVoiceIntent(trimmed);
  const quantity = parseSpokenQuantity(trimmed);
  const unit = parseSpokenUnit(trimmed);
  const candidateName = extractCandidateProductName(trimmed);

  // Match against products
  let matchedProduct: Product | undefined = undefined;
  const ambiguousProducts: Product[] = [];
  let bestScore = 0;

  if (candidateName) {
    const scoredList: { product: Product; score: number }[] = [];

    for (const prod of existingProducts) {
      if (prod.archived) continue;
      const engScore = calculateStringSimilarity(candidateName, prod.name);
      const hiScore = prod.nameHi ? calculateStringSimilarity(candidateName, prod.nameHi) : 0;
      const score = Math.max(engScore, hiScore);

      if (score >= 0.45) {
        scoredList.push({ product: prod, score });
      }
    }

    scoredList.sort((a, b) => b.score - a.score);

    if (scoredList.length > 0) {
      bestScore = scoredList[0].score;
      if (bestScore >= 0.70) {
        // Confident match if clear margin above second candidate
        if (scoredList.length === 1 || (bestScore - scoredList[1].score >= 0.15)) {
          matchedProduct = scoredList[0].product;
        } else {
          // Multiple products match closely: flag ambiguity
          ambiguousProducts.push(...scoredList.slice(0, 4).map((s) => s.product));
        }
      } else if (bestScore >= 0.45) {
        // Intermediate confidence: surface candidates for user clarification
        ambiguousProducts.push(...scoredList.slice(0, 4).map((s) => s.product));
      }
    }
  }

  // Determine missing fields and completeness
  const missingFields: string[] = [];
  let isComplete = false;
  let actionDescription = '';

  const effectiveUnit = unit || matchedProduct?.unit;

  switch (intent) {
    case 'low_stock_lookup': {
      isComplete = true;
      actionDescription = language === 'hi' 
        ? 'कम स्टॉक वाले सामान की सूची दिखाई जा रही है।' 
        : 'Displaying low-stock products list.';
      break;
    }

    case 'stock_lookup': {
      if (!matchedProduct) {
        if (ambiguousProducts.length > 1) {
          missingFields.push(language === 'hi' ? 'सामान का स्पष्ट चयन' : 'Product clarification');
          actionDescription = language === 'hi' 
            ? 'एक से अधिक सामान मिले। कृपया सही सामान चुनें।' 
            : 'Multiple matching items found. Please select one.';
        } else {
          missingFields.push(language === 'hi' ? 'सामान का नाम' : 'Product name');
          actionDescription = language === 'hi'
            ? `"${candidateName || trimmed}" नाम का सामान नहीं मिला।`
            : `Could not find product matching "${candidateName || trimmed}".`;
        }
      } else {
        isComplete = true;
        const name = language === 'hi' ? matchedProduct.nameHi || matchedProduct.name : matchedProduct.name;
        actionDescription = language === 'hi'
          ? `${name} का वर्तमान स्टॉक: ${matchedProduct.stockQty} ${matchedProduct.unit}`
          : `Current stock of ${name}: ${matchedProduct.stockQty} ${matchedProduct.unit}`;
      }
      break;
    }

    case 'record_sale': {
      if (!matchedProduct) {
        missingFields.push(language === 'hi' ? 'सामान (Product)' : 'Product');
      }
      if (quantity === undefined || quantity <= 0) {
        missingFields.push(language === 'hi' ? 'बिक्री मात्रा (Quantity)' : 'Sale Quantity');
      }

      if (matchedProduct && quantity !== undefined && quantity > 0) {
        isComplete = true;
        const name = language === 'hi' ? matchedProduct.nameHi || matchedProduct.name : matchedProduct.name;
        actionDescription = language === 'hi'
          ? `${name} की ${quantity} ${effectiveUnit || matchedProduct.unit} बिक्री दर्ज करने के लिए तैयार।`
          : `Ready to record sale of ${quantity} ${effectiveUnit || matchedProduct.unit} for ${name}.`;
      } else {
        actionDescription = language === 'hi'
          ? 'बिक्री दर्ज करने के लिए सामान और मात्रा स्पष्ट करें।'
          : 'Please specify both product and quantity to record a sale.';
      }
      break;
    }

    case 'receive_stock': {
      if (!matchedProduct) {
        missingFields.push(language === 'hi' ? 'सामान (Product)' : 'Product');
      }
      if (quantity === undefined || quantity <= 0) {
        missingFields.push(language === 'hi' ? 'आवक मात्रा (Quantity)' : 'Received Quantity');
      }

      if (matchedProduct && quantity !== undefined && quantity > 0) {
        isComplete = true;
        const name = language === 'hi' ? matchedProduct.nameHi || matchedProduct.name : matchedProduct.name;
        actionDescription = language === 'hi'
          ? `${name} में +${quantity} ${effectiveUnit || matchedProduct.unit} माल जोड़ने के लिए तैयार।`
          : `Ready to add +${quantity} ${effectiveUnit || matchedProduct.unit} to ${name}.`;
      } else {
        actionDescription = language === 'hi'
          ? 'नया माल जोड़ने के लिए सामान और मात्रा बताएं।'
          : 'Please specify both product and quantity to add stock.';
      }
      break;
    }

    default: {
      actionDescription = language === 'hi'
        ? 'निर्देश समझ नहीं आया। आप बिक्री, माल आवक, या स्टॉक चेक करने का आदेश दे सकते हैं।'
        : 'Intent not recognized. Try "Add 10 packet milk", "Sell 2 Parle-G", or "Kitna atta bacha hai".';
      break;
    }
  }

  return {
    intent,
    rawQuery: trimmed,
    productName: matchedProduct ? (language === 'hi' ? matchedProduct.nameHi || matchedProduct.name : matchedProduct.name) : (candidateName || undefined),
    matchedProduct,
    ambiguousProducts: ambiguousProducts.length > 0 ? ambiguousProducts : undefined,
    quantity,
    unit: effectiveUnit,
    isComplete,
    missingFields,
    confidence: bestScore > 0 ? Math.round(bestScore * 100) / 100 : (intent !== 'unknown' ? 0.75 : 0.2),
    actionDescription,
  };
}
