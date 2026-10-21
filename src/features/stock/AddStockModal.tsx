import React, { useState } from 'react';
import { X, PackagePlus, Check, AlertCircle } from 'lucide-react';
import { Product } from '@/domain/types';
import { applyStockInward } from '@/domain/stock';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddStock: (productId: string, quantity: number) => Promise<void> | void;
  language: 'hi' | 'en';
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddStock,
  language,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

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

  let updatedStockPreview: number | null = null;
  let validationError: string | null = error;

  if (selectedProduct) {
    try {
      updatedStockPreview = applyStockInward(selectedProduct.stockQty, quantity);
    } catch (err: unknown) {
      if (err instanceof Error) {
        validationError = err.message;
      }
    }
  }

  const handleConfirm = async () => {
    if (!selectedProduct) return;
    try {
      applyStockInward(selectedProduct.stockQty, quantity);
      setIsSubmitting(true);
      await onAddStock(selectedProduct.id, quantity);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="w-10 h-10 rounded-2xl bg-dukaan-amber-100 text-dukaan-amber-700 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">
                {language === 'hi' ? 'माल आया (Add Stock)' : 'Add Stock'}
              </h2>
              <p className="text-xs text-ink-muted">
                {language === 'hi' ? 'नया माल स्टॉक में जोड़ें और लेजर बनाएं' : 'Atomic inward receipt & ledger entry'}
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
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setError(null);
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-dukaan-amber-600 bg-dukaan-amber-50 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="leading-tight">
                      <div className="font-extrabold text-sm text-ink">
                        {language === 'hi' ? p.nameHi || p.name : p.name}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {p.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded-lg font-black bg-stone-100 text-stone-700">
                        {p.stockQty} {p.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          {selectedProduct && (
            <div className="bg-stone-50 rounded-3xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  {language === 'hi' ? 'आवक मात्रा' : 'Received Quantity'}
                </span>
                <span className="text-xs font-bold text-ink">
                  {language === 'hi' ? 'वर्तमान स्टॉक:' : 'Current Stock:'}{' '}
                  <span className="font-extrabold text-stone-900">
                    {selectedProduct.stockQty} {selectedProduct.unit}
                  </span>
                </span>
              </div>

              {/* Large Input with Steppers */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAdjustQty(-5)}
                  disabled={quantity <= 0.1 || isSubmitting}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 font-black text-sm text-ink disabled:opacity-40"
                >
                  -5
                </button>
                <div className="text-center px-2 flex flex-col items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quantity === 0 ? '' : quantity}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-28 text-center text-3xl font-black text-ink bg-transparent border-b-2 border-slate-300 focus:border-dukaan-amber-600 focus:outline-none"
                  />
                  <div className="text-xs font-bold text-ink-muted uppercase mt-0.5">
                    {selectedProduct.unit}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdjustQty(5)}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 font-black text-sm text-ink"
                >
                  +5
                </button>
              </div>

              {/* Quick Packs */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {[5, 10, 20, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className="px-3 py-1 text-xs font-bold bg-white rounded-lg border border-stone-300 hover:bg-stone-100"
                  >
                    +{val} {selectedProduct.unit}
                  </button>
                ))}
              </div>

              {/* Updated Stock Preview */}
              {validationError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-2.5 flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              ) : updatedStockPreview !== null ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>{language === 'hi' ? 'नया कुल स्टॉक होगा:' : 'Updated Total Stock:'}</span>
                  <span className="font-extrabold text-sm text-amber-950">
                    {updatedStockPreview} {selectedProduct.unit}
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
            disabled={isSubmitting || !!validationError || quantity <= 0}
            className="w-full min-h-touch-lg bg-dukaan-amber-600 hover:bg-dukaan-amber-700 disabled:opacity-40 text-white font-black text-lg rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>
              {isSubmitting
                ? (language === 'hi' ? 'लेजर में सहेज रहे हैं...' : 'Saving to Ledger...')
                : (language === 'hi' ? 'स्टॉक जोड़ें (Save Stock)' : 'Save Stock')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
