import { ProductUnit } from '@/domain/types';

export type HustleToolType = 'invoice' | 'listing' | 'marketing' | 'email' | 'receipt';

export interface InvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  lineTotal: number;
}

export type InvoicePaymentMode = 'cash' | 'upi' | 'udhaar' | 'card';
export type InvoiceStatus = 'paid' | 'pending' | 'draft' | 'cancelled';

export interface DukanInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  sellerName: string;
  sellerShopkeeper?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  sellerGstin?: string;
  sellerUpiId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  currency: string;
  taxRatePercent: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMode: InvoicePaymentMode;
  status: InvoiceStatus;
  notes?: string;
  items: InvoiceItem[];
  deductedFromStock?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface SavedProject {
  id: string;
  title: string;
  toolType: HustleToolType;
  content: string;
  metadataJson?: string;
  tags?: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface ListingRequest {
  productName: string;
  category: string;
  features: string;
  targetAudience?: string;
  language?: 'en' | 'hi' | 'hinglish';
  tone?: string;
  marketplace?: string;
  pricePoint?: string;
}

export interface ListingResponse {
  seoTitle: string;
  shortDescription: string;
  longDescription: string;
  keySellingPoints: string[];
  suggestedKeywords: string[];
  callToAction: string;
  modelUsed: string;
  isLocal: boolean;
  latencyMs: number;
}

export interface MarketingRequest {
  productOrService: string;
  campaignType: 'whatsapp_promo' | 'festival_offer' | 'instagram_caption' | 'weekend_sale' | 'product_launch';
  offerDetails?: string;
  targetAudience?: string;
  language?: 'en' | 'hi' | 'hinglish';
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
}

export interface MarketingResponse {
  headline: string;
  content: string;
  suggestedHashtags: string[];
  recommendedTiming: string;
  callToAction: string;
  modelUsed: string;
  isLocal: boolean;
  latencyMs: number;
}

export interface EmailRequest {
  emailType: 'payment_reminder' | 'quotation' | 'order_confirmation' | 'supplier_order';
  recipientName: string;
  recipientPhone?: string;
  recipientCompany?: string;
  subjectContext: string;
  keyDetails: string;
  tone?: string;
  language?: 'en' | 'hi' | 'hinglish';
  dueAmount?: number;
}

export interface EmailResponse {
  subjectLine: string;
  salutation: string;
  body: string;
  signOff: string;
  whatsappMessage: string;
  modelUsed: string;
  isLocal: boolean;
  latencyMs: number;
}

export interface ReceiptParsedData {
  merchantName?: string;
  date?: string;
  totalAmount?: number;
  taxAmount?: number;
  items: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  confidence: number;
  rawText: string;
}
