import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, ArrowDownLeft, ArrowUpRight, History, Package } from 'lucide-react';
import { Product, StockMovement, UpdateProductInput } from '@/domain/types';
import { productRepository } from '@/data/productRepository';
import { getStockStatus } from '@/domain/stock';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProduct: (id: string, updates: UpdateProductInput) => Promise<void> | void;
  language: 'hi' | 'en';
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdateProduct,
  language,
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name);
      setNameHi(product.nameHi || '');
      setCategory(product.category);
      setMinStock(product.minStock.toString());
      setSellingPrice(product.sellingPrice?.toString() || '');
      setCostPrice(product.costPrice?.toString() || '');
      setIsEditing(false);

      // Load movement history from IndexedDB
      setIsLoadingMovements(true);
      productRepository
        .getProductMovements(product.id)
        .then((m) => setMovements(m))
        .catch(console.error)
        .finally(() => setIsLoadingMovements(false));
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const stockStatus = getStockStatus(product.stockQty, product.minStock);

  const handleSaveEdit = async () => {
    const numMin = parseFloat(minStock) || 0;
    const numSell = sellingPrice ? parseFloat(sellingPrice) : undefined;
    const numCost = costPrice ? parseFloat(costPrice) : undefined;

    setIsSaving(true);
    try {
      await onUpdateProduct(product.id, {
        name: name.trim(),
        nameHi: nameHi.trim() || undefined,
        category: category.trim(),
        minStock: numMin,
        sellingPrice: numSell,
        costPrice: numCost,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {language === 'hi' ? product.nameHi || product.name : product.name}
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {product.category} • ID: {product.id.slice(-6)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title={language === 'hi' ? 'संपादित करें' : 'Edit Product'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 no-scrollbar pr-1">
          {/* Stock Status Badge Banner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'वर्तमान स्टॉक' : 'Current Stock'}
              </span>
              <div className="text-2xl font-black text-slate-950 mt-0.5">
                {product.stockQty} <span className="text-sm font-bold text-slate-500">{product.unit}</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                  stockStatus === 'out_of_stock'
                    ? 'bg-rose-100 text-rose-800'
                    : stockStatus === 'low_stock'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {stockStatus === 'out_of_stock'
                  ? (language === 'hi' ? 'खत्म माल (Out of Stock)' : 'Out of Stock')
                  : stockStatus === 'low_stock'
                  ? (language === 'hi' ? 'कम स्टॉक (Low Stock)' : 'Low Stock')
                  : (language === 'hi' ? 'सुरक्षित स्टॉक' : 'Adequate')}
              </span>
              <div className="text-[11px] font-semibold text-slate-400 mt-1">
                {language === 'hi' ? 'न्यूनतम:' : 'Min threshold:'} {product.minStock} {product.unit}
              </div>
            </div>
          </div>

          {/* Edit Form or Readonly View */}
          {isEditing ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {language === 'hi' ? 'विवरण संपादित करें' : 'Edit Product Details'}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  {language === 'hi' ? 'नाम' : 'Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {language === 'hi' ? 'न्यूनतम सीमा' : 'Min Stock'}
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {language === 'hi' ? 'बिक्री मूल्य (₹)' : 'Selling Price (₹)'}
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSaving ? '...' : (language === 'hi' ? 'सुरक्षित करें' : 'Save')}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Movement History Ledger (IndexedDB real logs) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-violet-600" />
                <span>{language === 'hi' ? 'स्टॉक लेजर इतिहास (Movement Ledger)' : 'Stock Movement Ledger'}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {movements.length} {language === 'hi' ? 'प्रविष्टियां' : 'records'}
              </span>
            </div>

            {isLoadingMovements ? (
              <div className="text-center py-6 text-xs text-slate-400">
                {language === 'hi' ? 'लेजर लोड हो रहा है...' : 'Loading ledger...'}
              </div>
            ) : movements.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-400">
                {language === 'hi' ? 'कोई स्टॉक हलचल दर्ज नहीं है' : 'No movements recorded yet'}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
                {movements.map((m) => {
                  const isSale = m.type === 'sale';
                  const dateStr = new Date(m.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                            isSale
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isSale ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {m.type === 'sale'
                              ? (language === 'hi' ? 'बिक्री' : 'Sale')
                              : m.type === 'received'
                              ? (language === 'hi' ? 'माल आया' : 'Stock Received')
                              : (language === 'hi' ? 'आरंभिक स्टॉक' : 'Opening Stock')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {dateStr} • {m.note || 'दुकान'}
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
                        <div className="text-[10px] text-slate-400">
                          {m.stockBefore} → {m.stockAfter}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
