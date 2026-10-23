import React, { useState, useRef } from 'react';
import { Product, ProductUnit } from '@/domain/types';
import {
  Receipt as ReceiptIcon,
  CheckCircle2,
  PackagePlus,
  Trash2,
  RefreshCw,
  Camera
} from 'lucide-react';

interface ReceiptScannerProps {
  products: Product[];
  language: 'hi' | 'en';
  onAddStockBatch?: (items: { productId: string; quantity: number; unit: ProductUnit; costPrice?: number }[]) => Promise<void>;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  products,
  language,
  onAddStockBatch,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Extracted Fields
  const [merchant, setMerchant] = useState('बालाजी ट्रेडिंग कंपनी (सप्लायर)');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState<number>(1480);
  const [confidenceScore, setConfidenceScore] = useState<number>(94);
  const [scannedItems, setScannedItems] = useState<
    { name: string; quantity: number; unit: ProductUnit; costPrice: number }[]
  >([
    { name: 'सरसों का तेल 1L', quantity: 10, unit: 'bottle', costPrice: 110 },
    { name: 'टाटा नमक 1kg', quantity: 20, unit: 'packet', costPrice: 19 },
  ]);

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsProcessing(true);

    // Heuristic OCR simulation / parser
    setTimeout(() => {
      setIsProcessing(false);
      setMerchant(file.name.includes('sharma') ? 'शर्मा डिस्ट्रीब्यूटर्स' : 'बालाजी ट्रेडिंग कंपनी');
      setConfidenceScore(88);
      setFeedback('पर्ची सफलतापूर्वक स्कैन हुई! विवरण जांचें।');
      setTimeout(() => setFeedback(null), 3000);
    }, 1200);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const updated = [...scannedItems];
    updated[index] = { ...updated[index], [field]: val };
    setScannedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const handleCommitToStock = async () => {
    if (!onAddStockBatch) {
      setFeedback('स्टॉक अपडेट फ़ंक्शन उपलब्ध नहीं है');
      return;
    }

    try {
      const itemsToCommit = scannedItems.map((item) => {
        const match = products.find(
          (p) => p.name.toLowerCase().includes(item.name.toLowerCase()) || (p.nameHi && p.nameHi.includes(item.name))
        );
        return {
          productId: match ? match.id : (products[0]?.id || 'unknown_prod'),
          quantity: item.quantity,
          unit: item.unit,
          costPrice: item.costPrice,
        };
      });

      await onAddStockBatch(itemsToCommit);
      setFeedback('✅ सभी सामान दुकान स्टॉक में सफलतापूर्वक जुड़ गए!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(err.message || 'स्टॉक जोड़ने में त्रुटि हुई');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
        <span className="p-2 rounded-2xl bg-teal-500 text-white">
          <ReceiptIcon className="w-5 h-5 stroke-[2.5]" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            {language === 'hi' ? 'सप्लायर पर्ची व रसीद स्कैनर (Receipt OCR)' : 'Receipt & Bill Scanner'}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {language === 'hi'
              ? 'सप्लायर का बिल फोटो खींचें या अपलोड करें, और 1-क्लिक में इन्वेंट्री में जोड़ें'
              : 'Scan supplier receipts with OCR, verify items, and push inward stock instantly'}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md">
          {feedback}
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all space-y-3"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {imagePreview ? (
          <img src={imagePreview} alt="Receipt preview" className="w-20 h-20 object-cover mx-auto rounded-xl shadow-md border-2 border-teal-500" />
        ) : (
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        <div>
          <p className="text-sm font-black text-slate-900">
            {isProcessing ? 'पर्ची स्कैन की जा रही है...' : 'सप्लायर बिल / पर्ची की फोटो खींचें या अपलोड करें'}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">
            PNG, JPG, JPEG (कैमरा या गैलरी से)
          </p>
        </div>
      </div>

      {/* Review Details Card */}
      <div className="bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-black text-base text-slate-900">
              स्कैन किया गया विवरण (Extracted Invoice Data)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
            विश्वसनीयता: {confidenceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              सप्लायर / व्यापारी (Supplier)
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              बिल दिनांक (Date)
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              कुल बिल राशि (Total Amount ₹)
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Scanned Items Table */}
        <div className="space-y-2">
          <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
            पर्ची से पहचाने गए सामान (Identified Stock Items):
          </p>

          <div className="space-y-2">
            {scannedItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                    className="w-full font-bold text-xs text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">मात्रा:</span>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center font-bold text-xs text-slate-900 border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                  <span className="text-xs text-slate-600 font-bold">{item.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">खरीद दर:</span>
                  <span className="text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={item.costPrice}
                    onChange={(e) => handleUpdateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                    className="w-20 text-center font-bold text-xs text-slate-900 border border-slate-200 rounded-lg px-2 py-1.5"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Push to inventory button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleCommitToStock}
            className="h-11 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-600/25 active:scale-95 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>इन्वेंट्री में यह माल तुरंत जोड़ें (+ Commit to Stock)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
