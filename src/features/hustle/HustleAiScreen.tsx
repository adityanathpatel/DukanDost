import React, { useState } from 'react';
import { Product, ProductUnit } from '@/domain/types';
import { InvoiceStudio } from './components/InvoiceStudio';
import { SmartListingWriter } from './components/SmartListingWriter';
import { MarketingCopyWriter } from './components/MarketingCopyWriter';
import { CustomerReminderWriter } from './components/CustomerReminderWriter';
import { ReceiptScanner } from './components/ReceiptScanner';
import { SavedProjectsView } from './components/SavedProjectsView';
import {
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export type HustleActiveTool =
  | 'invoice'
  | 'marketing'
  | 'listing'
  | 'reminder'
  | 'receipt'
  | 'saved';

interface HustleAiScreenProps {
  products: Product[];
  language: 'hi' | 'en';
  onRecordSale?: (productId: string, quantity: number) => Promise<void>;
  onAddStockBatch?: (items: { productId: string; quantity: number; unit: ProductUnit; costPrice?: number }[]) => Promise<void>;
  initialTool?: HustleActiveTool;
}

export const HustleAiScreen: React.FC<HustleAiScreenProps> = ({
  products,
  language,
  onRecordSale,
  onAddStockBatch,
  initialTool = 'invoice',
}) => {
  const [activeTool, setActiveTool] = useState<HustleActiveTool>(initialTool);

  const tools = [
    {
      id: 'invoice' as HustleActiveTool,
      label: language === 'hi' ? '🧾 बिल जनरेटर' : '🧾 Invoice Studio',
      sub: language === 'hi' ? 'दुकान बिल व चालान' : 'Billing & PDF',
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 'marketing' as HustleActiveTool,
      label: language === 'hi' ? '📢 प्रचार व ऑफर्स' : '📢 Marketing Copy',
      sub: language === 'hi' ? 'WhatsApp व त्योहार सेल' : 'Broadcasts & Deals',
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 'listing' as HustleActiveTool,
      label: language === 'hi' ? '📝 प्रोडक्ट लिस्टिंग' : '📝 Smart Listing',
      sub: language === 'hi' ? 'ऑनलाइन व कैटलॉग' : 'Catalog & SEO',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'reminder' as HustleActiveTool,
      label: language === 'hi' ? '💬 उधार तकादा' : '💬 Reminders & Quotes',
      sub: language === 'hi' ? 'तकादा व कोटेशन' : 'Khata & Estimates',
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'receipt' as HustleActiveTool,
      label: language === 'hi' ? '📑 पर्ची स्कैनर' : '📑 Receipt OCR',
      sub: language === 'hi' ? 'सप्लायर बिल व स्टॉक' : 'Scan & Inward Stock',
      color: 'from-teal-500 to-emerald-600',
    },
    {
      id: 'saved' as HustleActiveTool,
      label: language === 'hi' ? '📁 सहेजे गए बिल' : '📁 Saved Bills',
      sub: language === 'hi' ? 'इतिहास व प्रिंट' : 'History & Library',
      color: 'from-slate-700 to-slate-900',
    },
  ];

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* Top Banner with Air-Gapped Privacy Status */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                Hustle AI • हसल एआई स्टूडियो
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                100% On-Device / Air-Gapped
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'hi' ? 'दुकानदार बिज़नेस कोपायलट' : 'Shopkeeper Business Copilot'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-1 max-w-xl">
              {language === 'hi'
                ? 'कस्टमर बिल बनाएं, WhatsApp पर भेजें, त्योहारों का प्रचार करें और उधार तकादा भेजें — बिना इंटरनेट या महंगे टूल्स के।'
                : 'Deterministic billing, PDF export, bilingual WhatsApp marketing, and OCR scanner strictly on-device.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">इन्वेंट्री माल</p>
              <p className="text-base font-black text-amber-300">{products.length} प्रोडक्ट्स</p>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">गणित शुद्धता</p>
              <p className="text-base font-black text-emerald-400">100% सटीक</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Navigation Grid / Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-950 text-white border-slate-950 shadow-xl ring-2 ring-amber-400 scale-102'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`text-xs sm:text-sm font-black ${isActive ? 'text-amber-300' : 'text-slate-900'}`}>
                {t.label}
              </span>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                {t.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tool View */}
      <div className="transition-all">
        {activeTool === 'invoice' && (
          <InvoiceStudio
            products={products}
            language={language}
            onRecordSale={onRecordSale}
          />
        )}

        {activeTool === 'marketing' && (
          <MarketingCopyWriter
            products={products}
            language={language}
          />
        )}

        {activeTool === 'listing' && (
          <SmartListingWriter
            products={products}
            language={language}
          />
        )}

        {activeTool === 'reminder' && (
          <CustomerReminderWriter
            language={language}
          />
        )}

        {activeTool === 'receipt' && (
          <ReceiptScanner
            products={products}
            language={language}
            onAddStockBatch={onAddStockBatch}
          />
        )}

        {activeTool === 'saved' && (
          <SavedProjectsView
            language={language}
          />
        )}
      </div>
    </div>
  );
};
