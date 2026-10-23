import React, { useState } from 'react';
import { 
  ShoppingBag, 
  PackagePlus, 
  MessageCircle, 
  QrCode, 
  FileSpreadsheet,
  ArrowUpRight,
  Check,
  AlertOctagon,
  AlertTriangle,
  Clock,
  PackageCheck,
  ArrowRight,
  History,
  Camera,
  Mic,
  Sparkles
} from 'lucide-react';
import { ProductWithSales } from '@/data/sampleProducts';
import { StockMovement } from '@/domain/types';
import { calculateReorder } from '@/domain/reorder';
import { getStockStatus, getSlowMovingStatus } from '@/domain/stock';
import { generateWhatsAppOrderMessage, triggerWhatsAppShare } from '@/domain/whatsapp';
import { useAuth } from '@/features/auth';

import { NavigationTab } from '@/components/Navigation';

interface HomeScreenProps {
  products: ProductWithSales[];
  recentMovements?: StockMovement[];
  onOpenRecordSale: (productId?: string) => void;
  onOpenAddStock: (productId?: string) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  language: 'hi' | 'en';
  onOpenOCR?: () => void;
  onOpenVoice?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  products,
  recentMovements,
  onOpenRecordSale,
  onOpenAddStock,
  onNavigateTab,
  language,
  onOpenOCR,
  onOpenVoice,
}) => {
  const { storeName } = useAuth();
  const [copiedWhatsAppToast, setCopiedWhatsAppToast] = useState(false);
  // Stock status counts
  const outOfStockCount = products.filter(
    (p) => getStockStatus(p.stockQty, p.minStock) === 'out_of_stock'
  ).length;

  const lowStockCount = products.filter(
    (p) => getStockStatus(p.stockQty, p.minStock) === 'low_stock'
  ).length;

  const slowMovingCount = products.filter(
    (p) => getSlowMovingStatus({
      createdAt: p.createdAt,
      lastSaleAt: p.lastSaleAt,
      nowTimestamp: Date.now(),
      inactivityThresholdDays: 30,
    }).isSlowMoving
  ).length;

  const adequateCount = Math.max(0, products.length - outOfStockCount - lowStockCount);

  // Reorder calculations
  const reorderList = products
    .map((p) => {
      const calculation = calculateReorder({
        currentStock: p.stockQty,
        incomingStock: p.incomingStock ?? 0,
        averageDailySales: p.averageDailySales,
        supplierLeadTimeDays: p.supplierLeadTimeDays,
        safetyStock: p.safetyStock,
        minStock: p.minStock,
        packSize: p.packSize,
        unit: p.unit,
      });
      return { product: p, calculation };
    })
    .filter((item) => item.calculation.isReorderNeeded);

  const totalUrgent = reorderList.length;

  const handleWhatsAppShare = () => {
    const items = reorderList.map(({ product, calculation }) => ({
      name: language === 'hi' ? product.nameHi || product.name : product.name,
      reorderQuantity: calculation.reorderQuantity,
      unit: product.unit,
      currentStock: product.stockQty,
    }));

    const message = generateWhatsAppOrderMessage({
      storeName: storeName || (language === 'hi' ? 'शर्मा किराना स्टोर' : 'Sharma Kirana Store'),
      language,
      items,
    });

    triggerWhatsAppShare(message);
    setCopiedWhatsAppToast(true);
    setTimeout(() => setCopiedWhatsAppToast(false), 4000);
  };

  return (
    <div className="space-y-6 pb-20 pt-4">
      {/* Toast feedback for WhatsApp action */}
      {copiedWhatsAppToast && (
        <div className="bg-emerald-600 text-white text-xs font-black px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>
              {language === 'hi' 
                ? 'WhatsApp खुल रहा है और रीऑर्डर लिस्ट कॉपी हो गई है!' 
                : 'Opening WhatsApp & reorder list copied to clipboard!'}
            </span>
          </div>
        </div>
      )}

      {/* 1. TOP HERO BANNER (Command Center for Daily Inventory Priorities) */}
      <section 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl text-white bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border border-indigo-500/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black shadow-xs">
              <span>⚡</span>
              <span>{language === 'hi' ? 'दैनिक इन्वेंट्री प्राथमिकताएं' : 'Daily Inventory Priorities'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              {language === 'hi' 
                ? `${totalUrgent} आइटम आज तुरंत मंगाने की ज़रूरत है` 
                : `${totalUrgent} items require urgent reordering today`}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
              {language === 'hi' 
                ? 'शाम के ग्राहकों की भीड़ से पहले सप्लायर को रीऑर्डर भेजें ताकि बिक्री का नुकसान न हो।' 
                : 'Send reorder requests to your distributors before evening footfall to prevent stockouts.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('reports')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>{language === 'hi' ? 'पूरी रीऑर्डर शीट देखें' : 'View Reorder Sheet'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all border border-emerald-400/30"
              >
                <MessageCircle className="w-4 h-4 text-white stroke-[2.5]" />
                <span>{language === 'hi' ? 'WhatsApp पर शेयर करें' : 'Share on WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Right Live Inventory Health Gauge */}
          <div className="hidden lg:flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-md min-w-[210px] flex-shrink-0">
            <div className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {language === 'hi' ? 'स्टॉक स्वास्थ्य मीटर' : 'Inventory Health'}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{adequateCount}/{products.length}</span>
              <span className="text-xs font-bold text-slate-400">{language === 'hi' ? 'सुरक्षित' : 'healthy'}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${products.length > 0 ? Math.round((adequateCount / products.length) * 100) : 100}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
              <span>{outOfStockCount} {language === 'hi' ? 'शून्य' : 'out'}</span>
              <span>{lowStockCount} {language === 'hi' ? 'कम' : 'low'}</span>
              <span className="text-emerald-400">{adequateCount} {language === 'hi' ? 'पर्याप्त' : 'ok'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ELEVATED METRIC CARDS ROW */}
      <section aria-label="Inventory Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Out of Stock Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 bg-white border border-rose-100 hover:border-rose-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-rose-600">
              {outOfStockCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900">
              {language === 'hi' ? 'खत्म माल' : 'Out of Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'स्टॉक शून्य हो चुका है' : 'Zero items on shelf'}
            </div>
          </div>
          <div className="w-full bg-rose-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, outOfStockCount * 25)}%` }} />
          </div>
        </div>

        {/* Low Stock Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 bg-white border border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-amber-600">
              {lowStockCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900">
              {language === 'hi' ? 'कम स्टॉक' : 'Low Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'न्यूनतम सीमा से नीचे' : 'Below safety threshold'}
            </div>
          </div>
          <div className="w-full bg-amber-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, lowStockCount * 25)}%` }} />
          </div>
        </div>

        {/* Slow Moving Card */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="rounded-3xl p-5 bg-white border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-sky-600">
              {slowMovingCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900">
              {language === 'hi' ? 'सुस्त बिक्री' : 'Slow-Moving'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? '30 दिन से कोई बिक्री नहीं' : '>30 days inactive'}
            </div>
          </div>
          <div className="w-full bg-sky-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${Math.min(100, slowMovingCount * 25)}%` }} />
          </div>
        </div>

        {/* Adequate Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 bg-white border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PackageCheck className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-emerald-600">
              {adequateCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base text-slate-900">
              {language === 'hi' ? 'पर्याप्त स्टॉक' : 'Adequate Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              }).format(new Date())}
            </div>
          </div>
          <div className="w-full bg-emerald-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${products.length > 0 ? Math.min(100, Math.round((adequateCount / products.length) * 100)) : 100}%` }} />
          </div>
        </div>
      </section>

      {/* 3. BENTO ACTION GRID (Responsive 3-Column on Web) */}
      <section aria-label="Action Modules" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {language === 'hi' ? 'दुकान मुख्य कार्य (Store Actions)' : 'Quick Store Actions'}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {language === 'hi' ? 'दैनिक बिक्री व माल आवक के त्वरित शॉर्टकट' : 'Instant 1-tap store workflows'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Record Sale (Warm Amber Gold Palette) */}
          <div 
            onClick={() => onOpenRecordSale()}
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-amber-500/15 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all active:scale-98 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 border border-amber-300/80"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-xs font-black shadow-xs">
                  {language === 'hi' ? '⚡ त्वरित बिक्री' : 'Fast Sale'}
                </span>
                <span className="text-xs font-black text-slate-950">
                  3 Taps
                </span>
              </div>

              <h4 className="text-2xl font-black text-slate-950 mt-4 leading-tight">
                {language === 'hi' ? 'बिक्री दर्ज करें' : 'Record Sale'}
              </h4>

              <p className="text-xs font-bold text-slate-900 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'ग्राहक को सामान देते समय तुरंत मात्रा घटाएं। कापी-कलम से 3 गुना तेज़।' 
                  : 'Deduct stock instantly while attending customers. 3x faster than a notebook.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-xs font-black text-slate-950">
                  {language === 'hi' ? 'बिक्री शुरू करें' : 'Start Sale'}
                </span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
          </div>

          {/* Action 2: Add Inward Stock (Emerald Teal Palette) */}
          <div 
            onClick={() => onOpenAddStock()}
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-emerald-900/15 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all active:scale-98 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white border border-emerald-500/30"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-black border border-emerald-400/30">
                  {language === 'hi' ? '+ आवक माल' : '+ Stock Inward'}
                </span>
                <span className="text-xs font-bold text-emerald-100">
                  Distributor
                </span>
              </div>

              <h4 className="text-2xl font-black text-white mt-4 leading-tight">
                {language === 'hi' ? 'माल आया (Add Stock)' : 'Add Stock'}
              </h4>

              <p className="text-xs font-medium text-emerald-50 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'सप्लायर या थोक व्यापारी से आया नया माल इन्वेंट्री में जोड़ें।' 
                  : 'Receive incoming stock deliveries and update inventory immediately.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center shadow-sm">
                  <PackagePlus className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="text-xs font-black text-white">
                  {language === 'hi' ? 'स्टॉक जोड़ें' : 'Receive Delivery'}
                </span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white stroke-[3]" />
            </div>
          </div>

          {/* Action 3: Quick Tools & WhatsApp (Deep Indigo Slate Palette) */}
          <div 
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-slate-950/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/30"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-950/60 text-indigo-300 text-xs font-black border border-indigo-400/30">
                  {language === 'hi' ? 'सप्लायर टूल्स' : 'Vendor Tools'}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  WhatsApp
                </span>
              </div>

              <h4 className="text-2xl font-black text-white mt-4 leading-tight">
                {language === 'hi' ? 'सप्लायर रीऑर्डर' : 'Supplier Reorder'}
              </h4>

              <p className="text-xs font-medium text-slate-300 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'एक क्लिक में रीऑर्डर लिस्ट को WhatsApp संदेश के रूप में कॉपी व शेयर करें।' 
                  : 'One-click copy and share structured reorder list on WhatsApp.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all border border-emerald-400/30"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white flex items-center justify-center shadow-sm border border-white/[0.1] active:scale-95 transition-all"
                  title="Search inventory"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigateTab('reports')}
                  className="w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white flex items-center justify-center shadow-sm border border-white/[0.1] active:scale-95 transition-all"
                  title="Full Reports"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hustle AI Billing & Tools Feature Hero Card */}
        <div
          onClick={() => onNavigateTab('hustle')}
          className="p-6 rounded-3xl bg-gradient-to-r from-[#0B0F19] via-[#1E1B4B] to-[#0B0F19] text-white shadow-xl border border-amber-400/30 hover:border-amber-400/60 cursor-pointer hover:shadow-2xl transition-all group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/25 flex-shrink-0 border border-amber-300/50">
              <Sparkles className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white">
                  {language === 'hi' ? '⚡ बिल बनाएं (Invoice Studio) & Hustle AI' : '⚡ Generate Invoices & Hustle AI Copilot'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'पक्का जीएसटी व गैर-जीएसटी बिल, WhatsApp रसीद, त्योहारों का प्रचार व उधार तकादा'
                  : 'Deterministic invoices, vector print/PDF, WhatsApp broadcast copy, and payment reminders'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('hustle');
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? '🧾 नया बिल बनाएं' : '🧾 Create Invoice'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('hustle');
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs border border-white/[0.12] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{language === 'hi' ? '📢 WhatsApp प्रचार' : '📢 WhatsApp Promo'}</span>
            </button>
          </div>
        </div>

        {/* AI FAST ACTIONS STRIP (OCR & VOICE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* OCR Invoice Scanner */}
          {onOpenOCR && (
            <button
              onClick={onOpenOCR}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-300 shadow-sm hover:shadow-md flex items-center justify-between group active:scale-98 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform border border-amber-200/60">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{language === 'hi' ? 'बिल / पर्ची स्कैन करें' : 'Scan Bill / Invoice'}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">OCR AI</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    {language === 'hi' ? 'फोटो खींचें, स्टॉक अपने आप पहचाने' : 'Auto-extract products & quantities'}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
          )}

          {/* Voice Assistant */}
          {onOpenVoice && (
            <button
              onClick={onOpenVoice}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-violet-300 shadow-sm hover:shadow-md flex items-center justify-between group active:scale-98 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform border border-violet-200/60">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{language === 'hi' ? 'वॉइस असिस्टेंट' : 'Voice Assistant'}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">Hinglish</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    {language === 'hi' ? 'बोलकर बिक्री करें या स्टॉक पूछें' : 'Speak to record sales or check stock'}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
          )}
        </div>
      </section>

      {/* 4. REORDER PRIORITY TABLE / GRID (Full-Width Responsive Web Card) */}
      <section aria-label="Reorder Priority List" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              📋 {language === 'hi' ? 'रीऑर्डर प्राथमिकता सूची' : 'Reorder Priority Sheet'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              {totalUrgent} {language === 'hi' ? 'ज़रूरी' : 'urgent'}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition-colors"
          >
            <span>{language === 'hi' ? 'पूरी रिपोर्ट देखें' : 'View full report'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">{language === 'hi' ? 'सामान का नाम' : 'Product Name'}</th>
                  <th className="px-5 py-3.5">{language === 'hi' ? 'श्रेणी' : 'Category'}</th>
                  <th className="px-5 py-3.5">{language === 'hi' ? 'मौजूदा स्टॉक' : 'Current Stock'}</th>
                  <th className="px-5 py-3.5">{language === 'hi' ? 'सुझाया गया ऑर्डर' : 'Suggested Reorder'}</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">{language === 'hi' ? 'कारण' : 'Reason Basis'}</th>
                  <th className="px-5 py-3.5 text-right">{language === 'hi' ? 'कार्य' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reorderList.slice(0, 5).map(({ product, calculation }) => {
                  const isZero = product.stockQty <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-black text-slate-900">
                        {language === 'hi' ? product.nameHi || product.name : product.name}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                        {product.category}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                          isZero 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isZero ? (language === 'hi' ? 'खत्म (0)' : '0 left') : `${product.stockQty} ${product.unit}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300/80 text-xs font-black">
                          +{calculation.reorderQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 hidden md:table-cell">
                        {calculation.basis === 'sales_velocity'
                          ? (language === 'hi' ? 'दैनिक बिक्री गति आधार' : 'Sales velocity basis')
                          : (language === 'hi' ? 'न्यूनतम स्टॉक सीमा आधार' : 'Min threshold fallback')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onOpenAddStock(product.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all"
                        >
                          {language === 'hi' ? '+ माल जोड़ें' : '+ Add Stock'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. RECENT STOCK MOVEMENTS (Audit Ledger Preview) */}
      {recentMovements && recentMovements.length > 0 && (
        <section aria-label="Recent Stock Movements" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-violet-600" />
              <span>{language === 'hi' ? 'हालिया स्टॉक लेजर हलचल' : 'Recent Stock Ledger'}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {recentMovements.length} {language === 'hi' ? 'प्रविष्टियां' : 'recent logs'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentMovements.slice(0, 3).map((m) => {
              const isSale = m.type === 'sale';
              const prod = products.find((p) => p.id === m.productId);
              const prodName = language === 'hi' ? prod?.nameHi || prod?.name || m.productId : prod?.name || m.productId;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        isSale ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isSale ? '↓' : '↑'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-[140px]">
                        {prodName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.type === 'sale'
                          ? (language === 'hi' ? 'बिक्री' : 'Sale')
                          : m.type === 'received'
                          ? (language === 'hi' ? 'माल आया' : 'Inward')
                          : (language === 'hi' ? 'आरंभिक' : 'Opening')} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black ${
                        isSale ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                    </span>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      {m.stockBefore} → {m.stockAfter}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Website Footer Info */}
      <footer className="pt-4 pb-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <p>
          {language === 'hi' 
            ? 'दुकान दोस्त — 100% ऑफलाइन लोकल स्टोरेज • शून्य सर्वर निर्भरता' 
            : 'Dukan Dost — 100% Offline Local Persistence • Zero Server Dependency'}
        </p>
        <p>
          {storeName} • Verified Phase 2 Pure Domain Math
        </p>
      </footer>
    </div>
  );
};
