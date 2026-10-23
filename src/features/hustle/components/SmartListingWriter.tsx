import React, { useState } from 'react';
import { Product } from '@/domain/types';
import { ListingRequest, ListingResponse } from '../types';
import { HustleOfflineEngine } from '../services/hustleEngine';
import { hustleRepository } from '../data/hustleRepository';
import {
  ShoppingBag,
  Sparkles,
  Copy,
  CheckCircle2,
  BookmarkPlus,
  Package
} from 'lucide-react';

interface SmartListingWriterProps {
  products: Product[];
  language: 'hi' | 'en';
}

export const SmartListingWriter: React.FC<SmartListingWriterProps> = ({
  products,
  language,
}) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('किराना / खाद्य सामग्री');
  const [features, setFeatures] = useState('');
  const [targetAudience] = useState('घर-परिवार व दैनिक खरीदार');
  const [marketplace, setMarketplace] = useState('WhatsApp Store & Catalog');
  const [outputLang, setOutputLang] = useState<'hi' | 'en'>('hi');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ListingResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fill from inventory product
  const handleSelectProduct = (p: Product) => {
    setProductName(language === 'hi' ? p.nameHi || p.name : p.name);
    setCategory(p.category || 'दुकान उत्पाद');
    setFeatures(`इकाई: ${p.unit}, शुद्ध व ताज़ा स्टॉक, उचित मूल्य ₹${p.sellingPrice || p.costPrice || 0}`);
  };

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productName.trim()) return;

    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const req: ListingRequest = {
        productName,
        category,
        features,
        targetAudience,
        marketplace,
        language: outputLang,
      };

      const res = HustleOfflineEngine.generateListing(req);
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveToProject = async () => {
    if (!result) return;
    await hustleRepository.saveProject({
      title: `${productName} (${marketplace})`,
      toolType: 'listing',
      content: JSON.stringify(result, null, 2),
      tags: `${category}, ${marketplace}`,
      isFavorite: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
        <span className="p-2 rounded-2xl bg-indigo-500 text-white">
          <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            {language === 'hi' ? 'स्मार्ट प्रोडक्ट लिस्टिंग राइटर' : 'Smart Product Listing Writer'}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {language === 'hi'
              ? 'WhatsApp कैटलॉग, Amazon, Flipkart व ONDC हेतु उत्पाद का आकर्षक विवरण तैयार करें'
              : 'Generate high-converting e-commerce copy and marketplace listings'}
          </p>
        </div>
      </div>

      {/* Inventory Quick Autofill Strip */}
      {products.length > 0 && (
        <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 space-y-1.5">
          <p className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            दुकान स्टॉक से तुरंत लोड करें (Quick Autofill from Inventory):
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {products.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-xs font-bold text-slate-800 flex-shrink-0 transition-colors shadow-2xs"
              >
                {language === 'hi' ? p.nameHi || p.name : p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            उत्पाद का नाम (Product Name) *
          </label>
          <input
            type="text"
            required
            placeholder="उदा. राजधानी चना दाल 1kg"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            श्रेणी (Category)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            मुख्य विशेषताएं (Features / Specs)
          </label>
          <input
            type="text"
            placeholder="उदा. 100% शुद्ध, प्रोटीन से भरपूर, बिना मिलावट"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            कहाँ बेचना है (Platform)
          </label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-indigo-600"
          >
            <option value="WhatsApp Store & Catalog">WhatsApp Store & Catalog</option>
            <option value="Local Neighborhood Store">Local Neighborhood Store</option>
            <option value="Amazon India">Amazon India</option>
            <option value="Flipkart">Flipkart</option>
            <option value="ONDC Seller App">ONDC Seller App</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600">भाषा (Language):</span>
            <button
              type="button"
              onClick={() => setOutputLang('hi')}
              className={`px-3 py-1 rounded-xl text-xs font-black ${
                outputLang === 'hi' ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setOutputLang('en')}
              className={`px-3 py-1 rounded-xl text-xs font-black ${
                outputLang === 'en' ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              English
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !productName.trim()}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:opacity-90 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoading ? 'बनाया जा रहा है...' : '✨ लिस्टिंग जनरेट करें'}</span>
          </button>
        </div>
      </form>

      {/* Generated Result Card */}
      {result && (
        <div className="mt-6 p-5 sm:p-6 bg-slate-50 border-2 border-indigo-200 rounded-3xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-slate-900">
                तैयार प्रोडक्ट विवरण (Generated Output)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToProject}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>{savedSuccess ? 'सुरक्षित हो गया!' : 'सेव करें'}</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                SEO प्रोडक्ट शीर्षक (Title)
              </label>
              <button
                onClick={() => copyToClipboard(result.seoTitle, 'title')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'title' ? 'कॉपी हुआ!' : 'कॉपी करें'}
              </button>
            </div>
            <p className="font-black text-sm text-slate-950 bg-white p-3 rounded-xl border border-slate-200">
              {result.seoTitle}
            </p>
          </div>

          {/* Bullets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                मुख्य विशेषताएं (Key Selling Points)
              </label>
              <button
                onClick={() => copyToClipboard(result.keySellingPoints.join('\n'), 'bullets')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'bullets' ? 'कॉपी हुआ!' : 'कॉपी करें'}
              </button>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs font-bold text-slate-800">
              {result.keySellingPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-black">•</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                विस्तृत विवरण (Description)
              </label>
              <button
                onClick={() => copyToClipboard(result.longDescription, 'desc')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedKey === 'desc' ? 'कॉपी हुआ!' : 'कॉपी करें'}
              </button>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 whitespace-pre-line leading-relaxed">
              {result.longDescription}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              सुझाए गए कीवर्ड्स (Keywords)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {result.suggestedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
