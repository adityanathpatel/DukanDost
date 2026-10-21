import React, { useState } from 'react';
import { Search, Package, Plus, ShoppingBag, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Product, CreateProductInput, UpdateProductInput } from '@/domain/types';
import { getStockStatus } from '@/domain/stock';
import { AddProductModal } from './AddProductModal';
import { ProductDetailModal } from './ProductDetailModal';

interface InventoryScreenProps {
  products: Product[];
  onOpenRecordSale: (productId?: string) => void;
  onOpenAddStock: (productId?: string) => void;
  onAddProduct: (input: CreateProductInput) => Promise<void> | void;
  onUpdateProduct: (id: string, updates: UpdateProductInput) => Promise<void> | void;
  language: 'hi' | 'en';
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onOpenRecordSale,
  onOpenAddStock,
  onAddProduct,
  onUpdateProduct,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'out' | 'low' | 'adequate'>('all');

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameHi && p.nameHi.includes(searchQuery)) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const status = getStockStatus(p.stockQty, p.minStock);
    if (filter === 'out') return status === 'out_of_stock';
    if (filter === 'low') return status === 'low_stock';
    if (filter === 'adequate') return status === 'adequate';
    return true;
  });

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Search Header & Add Product Button */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'आइटम या श्रेणी खोजें...' : 'Search items or category...'}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-dukaan-green-500 shadow-2xs"
          />
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => setIsAddProductOpen(true)}
          className="h-10 px-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span className="hidden sm:inline">
            {language === 'hi' ? 'नया सामान' : 'Add Product'}
          </span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: language === 'hi' ? 'सभी सामान' : 'All Items' },
          { id: 'out', label: language === 'hi' ? 'खत्म माल' : 'Out of Stock' },
          { id: 'low', label: language === 'hi' ? 'कम स्टॉक' : 'Low Stock' },
          { id: 'adequate', label: language === 'hi' ? 'सुरक्षित' : 'Adequate' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id as typeof filter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
              filter === chip.id
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-extrabold text-slate-900 text-sm">
              {language === 'hi' ? 'कोई सामान नहीं मिला' : 'No items match your search'}
            </p>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'नया सामान जोड़ें' : 'Create new product'}</span>
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const status = getStockStatus(p.stockQty, p.minStock);
            const isOut = status === 'out_of_stock';
            const isLow = status === 'low_stock';

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow flex items-center justify-between gap-3"
              >
                <div 
                  className="space-y-1 flex-1 cursor-pointer"
                  onClick={() => setSelectedProductForDetail(p)}
                >
                  <div className="font-black text-slate-900 text-base leading-snug hover:text-violet-700 transition-colors flex items-center gap-1.5">
                    <span>{language === 'hi' ? p.nameHi || p.name : p.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-300" />
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span>{p.category}</span>
                    <span>•</span>
                    <span>₹{p.sellingPrice || 0}</span>
                  </div>
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black ${
                        isOut
                          ? 'bg-rose-100 text-rose-800'
                          : isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOut
                        ? (language === 'hi' ? 'खत्म माल' : 'Out of Stock')
                        : isLow
                        ? (language === 'hi' ? 'कम स्टॉक' : 'Low Stock')
                        : (language === 'hi' ? 'सुरक्षित' : 'Adequate')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div 
                    className="text-right cursor-pointer"
                    onClick={() => setSelectedProductForDetail(p)}
                  >
                    <div className="text-lg font-black text-slate-900">
                      {p.stockQty} <span className="text-xs font-bold text-slate-400">{p.unit}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400">
                      {language === 'hi' ? 'न्यूनतम:' : 'Min:'} {p.minStock} {p.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenRecordSale(p.id)}
                      disabled={isOut}
                      className="p-2 rounded-xl bg-dukaan-green-100 hover:bg-dukaan-green-200 text-dukaan-green-800 disabled:opacity-40 transition-colors shadow-2xs"
                      title={language === 'hi' ? 'बिक्री' : 'Record Sale'}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenAddStock(p.id)}
                      className="p-2 rounded-xl bg-dukaan-amber-100 hover:bg-dukaan-amber-200 text-dukaan-amber-800 transition-colors shadow-2xs"
                      title={language === 'hi' ? 'माल आया' : 'Add Stock'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={onAddProduct}
        language={language}
      />

      {/* Product Detail & Movement Ledger Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onUpdateProduct={onUpdateProduct}
        language={language}
      />
    </div>
  );
};
