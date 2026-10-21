import { Product, ProductUnit } from '@/domain/types';

// ==========================================
// FEATURE A: OCR Invoice & Stock-List Types
// ==========================================

export type MatchStatus = 'matched' | 'uncertain' | 'unmatched';

export interface ParsedInvoiceItem {
  id: string; // unique row id for review UI
  rawText: string;
  name: string;
  quantity: number;
  unit: ProductUnit;
  costPrice?: number;
  matchedProductId?: string;
  matchedProductName?: string;
  confidence: number; // 0.0 to 1.0
  status: MatchStatus;
  isApproved: boolean;
  validationError?: string;
}

export interface OCRScanResult {
  success: boolean;
  rawText: string;
  items: ParsedInvoiceItem[];
  warnings: string[];
}

// ==========================================
// FEATURE B: Hindi/Hinglish Voice Agent Types
// ==========================================

export type VoiceIntentType = 
  | 'stock_lookup' 
  | 'record_sale' 
  | 'receive_stock' 
  | 'low_stock_lookup' 
  | 'unknown';

export interface ParsedVoiceCommand {
  intent: VoiceIntentType;
  rawQuery: string;
  productName?: string;
  matchedProduct?: Product;
  ambiguousProducts?: Product[];
  quantity?: number;
  unit?: ProductUnit;
  isComplete: boolean;
  missingFields: string[];
  confidence: number;
  actionDescription: string;
}

// ==========================================
// FEATURE C: Demand Forecasting Types
// ==========================================

export type ForecastingStatus = 'sufficient_data' | 'insufficient_data';

export interface DailyForecastPoint {
  dayOffset: number; // 1 to 7
  dayName: string;
  dateString: string;
  predictedQuantity: number;
}

export interface ProductDemandForecast {
  productId: string;
  productName: string;
  unit: ProductUnit;
  status: ForecastingStatus;
  modelIdentifier: 'chronological_ema_dow_v1' | 'baseline_moving_avg' | 'insufficient_history';
  reason?: string;
  historicalDaysAnalyzed: number;
  averageDailySales: number;
  sevenDayForecast: DailyForecastPoint[];
  totalForecastedDemand: number;
  currentStock: number;
  suggestedReorderQty: number;
  mae?: number;
  wape?: number;
}

