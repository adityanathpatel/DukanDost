import React, { useState } from 'react';
import { X, Plus, Check, AlertCircle } from 'lucide-react';
import { CreateProductInput, ProductUnit } from '@/domain/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (input: CreateProductInput) => Promise<void> | void;
  language: 'hi' | 'en';
}

const COMMON_CATEGORIES = [
  'किराना (Grocery)',
  'अनाज व आटा (Grains & Flour)',
  'तेल व घी (Oils & Ghee)',
  'स्नैक्स व बिस्कुट (Snacks & Biscuits)',
  'चाय व कॉफी (Tea & Coffee)',
  'साबुन व सफाई (Cleaning & Personal)',
  'दवाइयां (Medicines & Pharma)',
  'हार्डवेयर व स्टेशनरी (Hardware & Stationery)',
];

const AVAILABLE_UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'packet', label: 'पैकेट (Packet)' },
  { value: 'piece', label: 'पीस / नग (Piece)' },
  { value: 'kg', label: 'किलो (Kilogram)' },
  { value: 'half_kg', label: 'आधा किलो (0.5 kg)' },
  { value: 'g', label: 'ग्राम (Gram)' },
  { value: 'liter', label: 'लीटर (Liter)' },
  { value: 'ml', label: 'मिलीलीटर (ml)' },
  { value: 'bottle', label: 'बोतल (Bottle)' },
  { value: 'dozen', label: 'दर्जन (Dozen)' },
  { value: 'box', label: 'डिब्बा / कार्टन (Box)' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  language,
}) => {
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [unit, setUnit] = useState<ProductUnit>('packet');
  const [stockQty, setStockQty] = useState<string>('0');
  const [minStock, setMinStock] = useState<string>('5');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(language === 'hi' ? 'सामान का नाम दर्ज करना अनिवार्य है' : 'Product name is required');
      return;
    }

    const numStock = parseFloat(stockQty) || 0;
    const numMin = parseFloat(minStock) || 0;
    const numCost = costPrice ? parseFloat(costPrice) : undefined;
    const numSelling = sellingPrice ? parseFloat(sellingPrice) : undefined;

    if (numStock < 0) {
      setError(language === 'hi' ? 'आरंभिक स्टॉक शून्य से कम नहीं हो सकता' : 'Opening stock cannot be negative');
      return;
    }
    if (numMin < 0) {
      setError(language === 'hi' ? 'न्यूनतम स्टॉक शून्य से कम नहीं हो सकता' : 'Minimum stock threshold cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddProduct({
        name: trimmedName,
        nameHi: nameHi.trim() || undefined,
        category,
        unit,
        stockQty: numStock,
        minStock: numMin,
        costPrice: numCost,
        sellingPrice: numSelling,
      });
      onClose();
      // Reset form
      setName('');
      setNameHi('');
      setStockQty('0');
      setMinStock('5');
      setCostPrice('');
      setSellingPrice('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating product';
      setError(msg);
    } finally {
      setIsSubmitting(false);
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
            <div className="w-10 h-10 rounded-2xl bg-dukaan-green-100 text-dukaan-green-800 flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {language === 'hi' ? 'नया सामान जोड़ें' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'hi' ? 'IndexedDB में तुरंत सुरक्षित होगा' : 'Saves directly to local IndexedDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1 no-scrollbar pr-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'hi' ? 'सामान का नाम *' : 'Product Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. Tata Tea Gold 250g' : 'e.g. Tata Tea Gold 250g'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          {/* Hindi Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === 'hi' ? 'हिन्दी नाम (वैकल्पिक)' : 'Hindi Name (Optional)'}
            </label>
            <input
              type="text"
              value={nameHi}
              onChange={(e) => setNameHi(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. टाटा टी गोल्ड 250g' : 'e.g. टाटा टी गोल्ड 250g'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          {/* Category & Unit in Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'hi' ? 'श्रेणी (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {language === 'hi' ? 'इकाई (Stock Unit) *' : 'Stock Unit *'}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              >
                {AVAILABLE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Quantities: Opening Stock & Minimum Threshold */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'hi' ? 'आरंभिक स्टॉक (Opening)' : 'Opening Stock'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              />
              <span className="text-[11px] text-slate-500">
                {language === 'hi' ? 'लेजर में दर्ज होगा' : 'Creates opening entry'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {language === 'hi' ? 'न्यूनतम सीमा (Min Stock)' : 'Min Threshold'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              />
              <span className="text-[11px] text-slate-500">
                {language === 'hi' ? 'कम स्टॉक अलर्ट' : 'Alert trigger level'}
              </span>
            </div>
          </div>

          {/* Prices (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                {language === 'hi' ? 'खरीद मूल्य (₹)' : 'Cost Price (₹)'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                {language === 'hi' ? 'बिक्री मूल्य (₹)' : 'Selling Price (₹)'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-slate-600 hover:bg-stone-50"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>
                {isSubmitting
                  ? (language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...')
                  : (language === 'hi' ? 'सामान जोड़ें' : 'Save Product')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
