import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingBag, AlertCircle, Check } from 'lucide-react';
import { Product } from '@/domain/types';
import { applySale } from '@/domain/stock';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRecordSale: (productId: string, quantity: number) => Promise<void> | void;
  language: 'hi' | 'en';
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  onRecordSale,
  language,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod && prod.stockQty < 1 && prod.stockQty > 0) {
      setQuantity(prod.stockQty);
    } else {
      setQuantity(1);
    }
    setError(null);
  };

  const handleAdjustQty = (delta: number) => {
    const newQty = Math.max(0.1, Math.round((quantity + delta) * 100) / 100);
    setQuantity(newQty);
    setError(null);
  };

  const handleInputChange = (val: string) => {
    const parsed = parseFloat(val);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setQuantity(parsed);
      setError(null);
    } else if (val === '') {
      setQuantity(0);
    }
  };

  let remainingStockPreview: number | null = null;
  let validationError: string | null = error;

  if (selectedProduct) {
    try {
      remainingStockPreview = applySale(selectedProduct.stockQty, quantity);
    } catch (err: unknown) {
      if (err instanceof Error) {
        validationError = err.message;
      }
    }
  }

  const handleConfirm = async () => {
    if (!selectedProduct) return;
    try {
      applySale(selectedProduct.stockQty, quantity);
      setIsSubmitting(true);
      await onRecordSale(selectedProduct.id, quantity);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDecimalUnit = selectedProduct?.unit === 'kg' || selectedProduct?.unit === 'half_kg' || selectedProduct?.unit === 'liter' || selectedProduct?.unit === 'g' || selectedProduct?.unit === 'ml';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-t-4xl sm:rounded-3xl p-5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col animate-slideUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-dukaan-green-100 text-dukaan-green-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">
                {language === 'hi' ? 'बिक्री दर्ज करें' : 'Record Sale'}
              </h2>
              <p className="text-xs text-ink-muted">
                {language === 'hi' ? 'स्टॉक तुरंत घटेगा और लेजर में दर्ज होगा' : 'Atomic stock deduction & ledger log'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-ink-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 no-scrollbar">
          {/* Product Selector */}
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'सामान चुनें *' : 'Select Product *'}
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
              {products.map((p) => {
                const isSelected = p.id === selectedProductId;
                const isOut = p.stockQty <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductSelect(p.id)}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-dukaan-green-600 bg-dukaan-green-50 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="leading-tight">
                      <div className="font-extrabold text-sm text-ink">
                        {language === 'hi' ? p.nameHi || p.name : p.name}
                      </div>
                      <div className="text-xs text-ink-muted">
                        ₹{p.sellingPrice || 0} • {p.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg font-black ${
                          isOut
                            ? 'bg-red-100 text-red-700'
                            : p.stockQty <= p.minStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut
                          ? (language === 'hi' ? 'शून्य' : '0 left')
                          : `${p.stockQty} ${p.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper & Available Stock */}
          {selectedProduct && (
            <div className="bg-stone-50 rounded-3xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {language === 'hi' ? 'बिक्री मात्रा' : 'Sale Quantity'}
                </span>
                <span className="text-xs font-bold text-ink">
                  {language === 'hi' ? 'उपलब्ध:' : 'Available:'}{' '}
                  <span className="font-extrabold text-dukaan-green-800">
                    {selectedProduct.stockQty} {selectedProduct.unit}
                  </span>
                </span>
              </div>

              {/* Large Stepper with Direct Input */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleAdjustQty(-1)}
                  disabled={quantity <= 0.1 || isSubmitting}
                  className="w-12 h-12 rounded-2xl bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center font-black text-lg text-ink disabled:opacity-40 shadow-sm active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 flex flex-col items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quantity === 0 ? '' : quantity}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-28 text-center text-3xl font-black text-ink bg-transparent border-b-2 border-slate-300 focus:border-dukaan-green-600 focus:outline-none"
                  />
                  <div className="text-xs font-bold text-ink-muted uppercase mt-0.5">
                    {selectedProduct.unit}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjustQty(1)}
                  disabled={isSubmitting}
                  className="w-12 h-12 rounded-2xl bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center font-black text-lg text-ink shadow-sm active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Jump Buttons for loose / small items */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {isDecimalUnit ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuantity(0.25)}
                      className="px-2.5 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      0.25 {selectedProduct.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(0.5)}
                      className="px-2.5 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      0.5 {selectedProduct.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(1)}
                      className="px-2.5 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      1 {selectedProduct.unit}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuantity(1)}
                      className="px-3 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(2)}
                      className="px-3 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(5)}
                      className="px-3 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      +5
                    </button>
                  </>
                )}
              </div>

              {/* Stock Preview or Error */}
              {validationError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-2.5 flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              ) : remainingStockPreview !== null ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>{language === 'hi' ? 'बिक्री के बाद बचेगा:' : 'Remaining stock:'}</span>
                  <span className="font-extrabold text-sm">
                    {remainingStockPreview} {selectedProduct.unit}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              isSubmitting ||
              !!validationError ||
              quantity <= 0 ||
              (selectedProduct && selectedProduct.stockQty <= 0)
            }
            className="w-full min-h-touch-lg bg-dukaan-green-700 hover:bg-dukaan-green-800 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-lg rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>
              {isSubmitting
                ? (language === 'hi' ? 'बिक्री दर्ज हो रही है...' : 'Saving to Ledger...')
                : (language === 'hi' ? 'बिक्री पक्की करें' : 'Confirm Sale')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
