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
  Mic
} from 'lucide-react';
import { ProductWithSales } from '@/data/sampleProducts';
import { StockMovement } from '@/domain/types';
import { calculateReorder } from '@/domain/reorder';
import { getStockStatus, getSlowMovingStatus } from '@/domain/stock';
import { generateWhatsAppOrderMessage, triggerWhatsAppShare } from '@/domain/whatsapp';
import { useAuth } from '@/features/auth';

interface HomeScreenProps {
  products: ProductWithSales[];
  recentMovements?: StockMovement[];
  onOpenRecordSale: (productId?: string) => void;
  onOpenAddStock: (productId?: string) => void;
  onNavigateTab: (tab: 'inventory' | 'reports' | 'profile') => void;
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
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(-1); // -1 = will default to today
  const [copiedWhatsAppToast, setCopiedWhatsAppToast] = useState(false);

  // Dynamically build the current week's 7-day strip (Mon–Sun or Sun–Sat centred on today)
  const todayReal = new Date();
  const todayDayOfWeek = todayReal.getDay(); // 0 = Sun
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayReal);
    d.setDate(todayReal.getDate() - todayDayOfWeek + i);
    return {
      day: shortDays[d.getDay()],
      date: d.getDate(),
      isToday: d.toDateString() === todayReal.toDateString(),
    };
  });
  const todayWeekIndex = daysOfWeek.findIndex((d) => d.isToday);

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

  const adequateCount = products.length - outOfStockCount - lowStockCount;

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

      {/* 1. TOP HERO BANNER (Spacious Responsive Web Card with Vibrant Pop Palette) */}
      <section 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-xl text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 border-2 border-violet-400/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-sm">
              <span>⚡</span>
              <span>{language === 'hi' ? 'दैनिक इन्वेंट्री प्राथमिकताएं' : 'Daily Inventory Priorities'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              {language === 'hi' 
                ? `${totalUrgent} आइटम आज तुरंत मंगाने की ज़रूरत है` 
                : `${totalUrgent} items require urgent reordering today`}
            </h2>
            <p className="text-sm font-semibold text-violet-100 leading-relaxed">
              {language === 'hi' 
                ? 'शाम के ग्राहकों की भीड़ से पहले सप्लायर को रीऑर्डर भेजें ताकि बिक्री का नुकसान न हो।' 
                : 'Send reorder requests to your distributors before evening footfall to prevent stockouts.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('reports')}
                className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>{language === 'hi' ? 'पूरी रीऑर्डर शीट देखें' : 'View Reorder Sheet'}</span>
                <ArrowRight className="w-4 h-4 text-violet-700" />
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="px-4.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all border border-emerald-300/40"
              >
                <MessageCircle className="w-4 h-4 text-white stroke-[2.5]" />
                <span>{language === 'hi' ? 'WhatsApp पर शेयर करें' : 'Share on WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* 3D Geometric Graphics */}
          <div className="hidden md:flex relative w-44 h-36 items-center justify-center select-none flex-shrink-0">
            <div className="absolute top-2 right-4 w-16 h-18 rounded-full border-[9px] border-amber-400 shadow-lg rotate-12" />
            <div className="absolute top-6 right-16 w-14 h-14 bg-slate-800 rounded-2xl shadow-xl -rotate-12 border border-slate-700 flex items-center justify-center text-white/50 text-xs font-black">
              STOCK
            </div>
            <div className="absolute top-12 right-6 w-12 h-12 bg-slate-200 rounded-xl shadow-lg rotate-45 border border-white/50" />
            <div className="absolute bottom-2 right-12 w-10 h-10 rounded-full border-[7px] border-yellow-300 shadow-sm" />
          </div>
        </div>
      </section>

      {/* 2. RESPONSIVE METRIC CARDS ROW */}
      <section aria-label="Inventory Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Out of Stock Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 border border-pastel-pink-border bg-pastel-pink-light shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-pastel-pink text-pastel-pink-text flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-pastel-pink-text">
              {outOfStockCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900">
              {language === 'hi' ? 'खत्म माल (Out of Stock)' : 'Out of Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'स्टॉक शून्य हो चुका है' : 'Zero items on shelf'}
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 border border-pastel-orange-border bg-pastel-orange-light shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-pastel-orange text-pastel-orange-text flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-pastel-orange-text">
              {lowStockCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900">
              {language === 'hi' ? 'कम स्टॉक (Low Stock)' : 'Low Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'न्यूनतम सीमा से नीचे' : 'Below safety threshold'}
            </div>
          </div>
        </div>

        {/* Slow Moving Card */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="rounded-3xl p-5 border border-pastel-blue-border bg-pastel-blue-light shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-pastel-blue text-pastel-blue-text flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-pastel-blue-text">
              {slowMovingCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900">
              {language === 'hi' ? 'सुस्त बिक्री (Slow-Moving)' : 'Slow-Moving'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? '30 दिन से कोई बिक्री नहीं' : '>30 days inactive'}
            </div>
          </div>
        </div>

        {/* Adequate Card */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="rounded-3xl p-5 border border-pastel-green-border bg-pastel-green-light shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-2xl bg-pastel-green text-pastel-green-text flex items-center justify-center">
              <PackageCheck className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-3xl font-black text-pastel-green-text">
              {adequateCount}
            </span>
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-900">
              {language === 'hi' ? 'पर्याप्त स्टॉक (Adequate)' : 'Adequate Stock'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              }).format(new Date())}
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO ACTION GRID (Responsive 3-Column on Web) */}
      <section aria-label="Action Modules" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {language === 'hi' ? 'दुकान मुख्य कार्य (Store Actions)' : 'Quick Store Actions'}
          </h3>
          {/* Day selection strip for web */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200">
            {daysOfWeek.map((d, idx) => (
              <button
                key={d.day}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedDayIndex === idx
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {d.day} {d.date}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Record Sale (Pop Amber-Orange Gradient) */}
          <div 
            onClick={() => onOpenRecordSale()}
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-amber-500/20 cursor-pointer hover:shadow-xl transition-all active:scale-98 bg-gradient-to-br from-amber-400 via-amber-400 to-orange-400 text-slate-950 border-2 border-amber-300"
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

              <p className="text-xs font-extrabold text-slate-900 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'ग्राहक को सामान देते समय तुरंत मात्रा घटाएं। कापी-कलम से 3 गुना तेज़।' 
                  : 'Deduct stock instantly while attending customers. 3x faster than a notebook.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-xs font-black text-slate-950">
                  {language === 'hi' ? 'बिक्री शुरू करें' : 'Start Sale'}
                </span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
          </div>

          {/* Action 2: Add Inward Stock (Pop Cyan-Sky Gradient) */}
          <div 
            onClick={() => onOpenAddStock()}
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/20 cursor-pointer hover:shadow-xl transition-all active:scale-98 bg-gradient-to-br from-sky-400 via-sky-300 to-blue-400 text-slate-950 border-2 border-sky-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-950 text-sky-300 text-xs font-black shadow-xs">
                  {language === 'hi' ? '+ आवक माल' : '+ Stock Inward'}
                </span>
                <span className="text-xs font-black text-slate-950">
                  Distributor
                </span>
              </div>

              <h4 className="text-2xl font-black text-slate-950 mt-4 leading-tight">
                {language === 'hi' ? 'माल आया (Add Stock)' : 'Add Stock'}
              </h4>

              <p className="text-xs font-extrabold text-slate-900 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'सप्लायर या थोक व्यापारी से आया नया माल इन्वेंट्री में जोड़ें।' 
                  : 'Receive incoming stock deliveries and update inventory immediately.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-sm">
                  <PackagePlus className="w-5 h-5 text-sky-300" />
                </div>
                <span className="text-xs font-black text-slate-950">
                  {language === 'hi' ? 'स्टॉक जोड़ें' : 'Receive Delivery'}
                </span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
          </div>

          {/* Action 3: Quick Tools & WhatsApp (Pop Fuchsia-Pink Gradient) */}
          <div 
            className="rounded-3xl p-6 flex flex-col justify-between shadow-lg shadow-pink-500/20 bg-gradient-to-br from-pink-400 via-rose-300 to-fuchsia-400 text-slate-950 border-2 border-pink-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-white/50 text-xs font-black text-slate-950">
                  {language === 'hi' ? 'सप्लायर टूल्स' : 'Vendor Tools'}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  WhatsApp
                </span>
              </div>

              <h4 className="text-2xl font-black text-slate-950 mt-4 leading-tight">
                {language === 'hi' ? 'सप्लायर रीऑर्डर' : 'Supplier Reorder'}
              </h4>

              <p className="text-xs font-bold text-slate-900/80 mt-2 leading-relaxed">
                {language === 'hi' 
                  ? 'एक क्लिक में रीऑर्डर लिस्ट को WhatsApp संदेश के रूप में कॉपी व शेयर करें।' 
                  : 'One-click copy and share structured reorder list on WhatsApp.'}
              </p>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="h-10 px-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                  title="Barcode search"
                >
                  <QrCode className="w-4 h-4 text-purple-700" />
                </button>

                <button
                  onClick={() => onNavigateTab('reports')}
                  className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                  title="Full Reports"
                >
                  <FileSpreadsheet className="w-4 h-4 text-pink-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI FAST ACTIONS STRIP (OCR & VOICE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* OCR Invoice Scanner */}
          {onOpenOCR && (
            <button
              onClick={onOpenOCR}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm flex items-center justify-between group active:scale-98 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{language === 'hi' ? 'बिल / पर्ची स्कैन करें' : 'Scan Bill / Invoice'}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">OCR AI</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
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
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm flex items-center justify-between group active:scale-98 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>{language === 'hi' ? 'वॉइस असिस्टेंट' : 'Voice Assistant'}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">Hinglish</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">
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
            className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1"
          >
            <span>{language === 'hi' ? 'पूरी रिपोर्ट देखें' : 'View full report'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
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
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-pastel-orange text-pastel-orange-text border border-pastel-orange-border text-xs font-black">
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
