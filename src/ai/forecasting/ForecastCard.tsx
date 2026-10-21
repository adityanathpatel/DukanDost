import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldCheck
} from 'lucide-react';
import { Product, StockMovement } from '@/domain/types';
import { generateProductForecast } from './forecaster';
import { calculateReorder } from '@/domain/reorder';

interface ForecastCardProps {
  products: Product[];
  movements: StockMovement[];
  language: 'hi' | 'en';
  onReorderClick?: (productId: string) => void;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  products,
  movements,
  language,
  onReorderClick,
}) => {
  const activeProducts = useMemo(() => products.filter((p) => !p.archived), [products]);
  const [selectedProductId, setSelectedProductId] = useState<string>(activeProducts[0]?.id || '');

  // Current selected product
  const currentProduct = useMemo(
    () => activeProducts.find((p) => p.id === selectedProductId) || activeProducts[0],
    [activeProducts, selectedProductId]
  );

  // Compute forecast for current product
  const forecast = useMemo(() => {
    if (!currentProduct) return null;
    return generateProductForecast(currentProduct, movements, Date.now(), language);
  }, [currentProduct, movements, language]);

  // Baseline rule reorder for comparison
  const baselineReorder = useMemo(() => {
    if (!currentProduct) return null;
    return calculateReorder({
      currentStock: currentProduct.stockQty,
      incomingStock: 0,
      averageDailySales: currentProduct.averageDailySales,
      supplierLeadTimeDays: currentProduct.supplierLeadTimeDays,
      safetyStock: currentProduct.safetyStock,
      minStock: currentProduct.minStock,
      packSize: currentProduct.packSize,
      unit: currentProduct.unit,
    });
  }, [currentProduct]);

  if (!currentProduct || !forecast) {
    return null;
  }

  // Calculate highest predicted value for chart bar scaling
  const maxForecastQty = Math.max(
    1,
    ...forecast.sevenDayForecast.map((d) => d.predictedQuantity)
  );

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Header & Product Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
              <span>{language === 'hi' ? '7-दिवसीय मांग पूर्वानुमान (AI/ML)' : '7-Day Demand Forecast (AI/ML)'}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                Time-Series
              </span>
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              {language === 'hi'
                ? 'कालानुक्रमिक बिक्री इतिहास व मौसमी मांग के आधार पर'
                : 'Based on chronological sales velocity and Day-of-Week seasonality'}
            </p>
          </div>
        </div>

        {/* Product Dropdown Selector */}
        <div className="min-w-[200px]">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {language === 'hi' ? p.nameHi || p.name : p.name} ({p.stockQty} {p.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Insufficient Data State */}
      {forecast.status === 'insufficient_data' ? (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-900">
                {language === 'hi' ? 'अपर्याप्त बिक्री डेटा (Insufficient Data)' : 'Insufficient Historical Data'}
              </h4>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                {forecast.reason}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-600 font-semibold">
              {language === 'hi'
                ? 'सिस्टम स्वचालित रूप से न्यूनतम स्टॉक सीमा नियम पर निर्भर है:'
                : 'System automatically falls back to your minimum stock threshold rule:'}
            </div>
            <div className="font-black text-slate-900">
              {baselineReorder?.reorderQuantity || 0} {currentProduct.unit} {language === 'hi' ? 'सुझाया गया' : 'recommended'}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                {language === 'hi' ? '7 दिन की अनुमानित मांग' : '7-Day Demand'}
              </span>
              <div className="text-xl font-black text-indigo-950 mt-1">
                {forecast.totalForecastedDemand} {forecast.unit}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {language === 'hi' ? 'दैनिक औसत बिक्री' : 'Daily Sales Avg'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {forecast.averageDailySales} {forecast.unit}/day
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {language === 'hi' ? 'मॉडल त्रुटि (MAE)' : 'Model Error (MAE)'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {forecast.mae !== undefined ? `${forecast.mae} ${forecast.unit}` : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {language === 'hi' ? 'मॉडल शुद्धता (WAPE)' : 'Accuracy (WAPE)'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {forecast.wape !== undefined ? `${Math.round(forecast.wape * 100)}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* 7-Day Forecast Histogram / Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-700">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>{language === 'hi' ? 'आगामी 7 दिनों का दैनिक अनुमान:' : 'Daily Forward Estimates:'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {language === 'hi' ? 'इकाई: ' : 'Unit: '} {forecast.unit}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2">
              {forecast.sevenDayForecast.map((point) => {
                const heightPercent = Math.max(15, Math.round((point.predictedQuantity / maxForecastQty) * 100));

                return (
                  <div key={point.dayOffset} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-800">
                      {point.predictedQuantity}
                    </span>

                    <div className="w-full h-24 bg-slate-100 rounded-xl flex items-end p-1 overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg transition-all shadow-xs"
                      />
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-700 truncate w-12 sm:w-16">
                        {point.dayName}
                      </div>
                      <div className="text-[9px] font-semibold text-slate-400">
                        {point.dateString.slice(5)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reorder Comparison Card: Baseline Rule vs AI Forecast */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  {language === 'hi' ? 'स्मार्ट रीऑर्डर तुलना' : 'Smart Reorder Comparison'}
                </span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {language === 'hi' ? 'वर्तमान स्टॉक: ' : 'Current on shelf: '}
                  <span className="font-black text-slate-950">{forecast.currentStock} {forecast.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400">
                    {language === 'hi' ? 'न्यूनतम सीमा नियम:' : 'Baseline Min-Stock:'}
                  </div>
                  <div className="text-xs font-black text-slate-700">
                    +{baselineReorder?.reorderQuantity || 0} {forecast.unit}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="text-right">
                  <div className="text-[10px] font-black text-indigo-700">
                    {language === 'hi' ? 'AI 7-दिन पूर्वानुमान:' : 'AI 7-Day Forecast:'}
                  </div>
                  <div className="text-base font-black text-indigo-900">
                    +{forecast.suggestedReorderQty} {forecast.unit}
                  </div>
                </div>

                {onReorderClick && forecast.suggestedReorderQty > 0 && (
                  <button
                    onClick={() => onReorderClick(currentProduct.id)}
                    className="ml-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>{language === 'hi' ? 'स्टॉक मंगाएं' : 'Reorder'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-1 border-t border-indigo-100/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>
                {language === 'hi'
                  ? `मॉडल: Day-of-Week Seasonality + EMA (${forecast.historicalDaysAnalyzed} दिन का वास्तविक इतिहास विश्लेषित)`
                  : `Model: Day-of-Week Seasonality + EMA (${forecast.historicalDaysAnalyzed} days chronological history analyzed)`}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

