import React from 'react';
import { AlertCircle, Clock, ArrowUpRight } from 'lucide-react';
import { ProductWithSales } from '@/data/sampleProducts';
import { StockMovement } from '@/domain/types';
import { calculateReorder } from '@/domain/reorder';
import { getSlowMovingStatus } from '@/domain/stock';
import { ForecastCard } from '@/ai/forecasting/ForecastCard';

interface ReportsScreenProps {
  products: ProductWithSales[];
  movements?: StockMovement[];
  language: 'hi' | 'en';
  onReorderClick: (productId: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  products,
  movements = [],
  language,
  onReorderClick,
}) => {
  // Compute reorder suggestions
  const reorderItems = products
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

  // Compute slow-moving items
  const slowMovingItems = products
    .map((p) => {
      const status = getSlowMovingStatus({
        createdAt: p.createdAt,
        lastSaleAt: p.lastSaleAt,
        nowTimestamp: Date.now(),
        inactivityThresholdDays: 30,
      });
      return { product: p, status };
    })
    .filter((item) => item.status.isSlowMoving);

  return (
    <div className="space-y-6 pb-28 pt-2">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-ink">
          {language === 'hi' ? 'रीऑर्डर व स्टॉक रिपोर्ट' : 'Reorder & Stock Intelligence'}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {language === 'hi'
            ? 'पारदर्शी गणना — बिना किसी मनगढ़ंत दावे के'
            : 'Transparent calculations — zero fabricated claims'}
        </p>
      </div>

      {/* AI Demand Forecasting Card */}
      <ForecastCard
        products={products}
        movements={movements}
        language={language}
        onReorderClick={onReorderClick}
      />

      {/* Reorder Suggestions Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pastel-orange-text" />
            {language === 'hi' ? 'मंगाने योग्य सामान (Reorder Sheet)' : 'Recommended for Reorder'}
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {reorderItems.length} {language === 'hi' ? 'आइटम' : 'items'}
          </span>
        </div>

        {reorderItems.length === 0 ? (
          <div className="bg-pastel-green-light border border-pastel-green-border rounded-3xl p-5 text-center text-xs font-bold text-pastel-green-text">
            {language === 'hi' ? 'सभी सामान पर्याप्त हैं! अभी किसी ऑर्डर की ज़रूरत नहीं है।' : 'All items well-stocked! No reorders needed right now.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {reorderItems.map(({ product, calculation }) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-base text-ink">
                      {language === 'hi' ? product.nameHi || product.name : product.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-500">
                      {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                      <span className="font-extrabold text-ink">
                        {product.stockQty} {product.unit}
                      </span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-pastel-orange text-pastel-orange-text border border-pastel-orange-border rounded-xl text-sm font-black">
                      +{calculation.reorderQuantity} {product.unit}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-2xl p-2.5 text-xs text-slate-600 font-medium border border-stone-100 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{calculation.explanation}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {calculation.basis === 'sales_velocity'
                      ? (language === 'hi' ? 'दैनिक बिक्री आधार' : 'Sales Velocity Basis')
                      : (language === 'hi' ? 'न्यूनतम सीमा आधार' : 'Min-Stock Threshold')}
                  </span>
                  <button
                    onClick={() => onReorderClick(product.id)}
                    className="text-xs font-extrabold text-dukaan-green-700 hover:text-dukaan-green-800 flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'स्टॉक जोड़ें' : 'Add Received'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Slow-Moving Stock Section */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-pastel-blue-text" />
            {language === 'hi' ? 'सुस्त बिक्री (रुका हुआ माल)' : 'Slow-Moving / Dead Stock'}
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {slowMovingItems.length} {language === 'hi' ? 'आइटम' : 'items'}
          </span>
        </div>

        {slowMovingItems.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-3xl p-4 text-center text-xs font-semibold text-slate-500">
            {language === 'hi' ? 'कोई सुस्त माल नहीं मिला।' : 'No slow-moving products flagged.'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {slowMovingItems.map(({ product, status }) => (
              <div
                key={product.id}
                className="bg-pastel-blue-light border border-pastel-blue-border rounded-3xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-base text-ink">
                      {language === 'hi' ? product.nameHi || product.name : product.name}
                    </h4>
                    <span className="text-xs font-bold text-slate-600">
                      {language === 'hi' ? 'दुकान में पड़ा माल:' : 'Stock on hand:'}{' '}
                      <span className="font-extrabold text-ink">
                        {product.stockQty} {product.unit} (₹{(product.costPrice || 0) * product.stockQty})
                      </span>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-pastel-blue-text border border-pastel-blue-border rounded-xl text-xs font-black">
                    {status.daysSinceLastSale
                      ? `${status.daysSinceLastSale}d ${language === 'hi' ? 'से बिना बिक्री' : 'inactive'}`
                      : (language === 'hi' ? 'कभी नहीं बिका' : 'Never sold')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {status.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
