import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Loader2, 
  HelpCircle,
  PackageCheck
} from 'lucide-react';
import { Product, ProductUnit } from '@/domain/types';
import { ParsedInvoiceItem } from '../types';
import { scanInvoiceImage } from './ocrEngine';
import { validateInvoiceImageFile } from './imageValidator';
import { generateId } from '@/data/productRepository';

interface OCRReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onCommitInwardBatch: (
    items: { productId: string; quantity: number; unit: ProductUnit; costPrice?: number }[]
  ) => Promise<void>;
  language: 'hi' | 'en';
}

const AVAILABLE_UNITS: ProductUnit[] = [
  'packet',
  'piece',
  'kg',
  'half_kg',
  'g',
  'liter',
  'ml',
  'bottle',
  'dozen',
  'box',
];

export const OCRReviewModal: React.FC<OCRReviewModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onCommitInwardBatch,
  language,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [items, setItems] = useState<ParsedInvoiceItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateInvoiceImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'अमान्य फ़ाइल');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessCount(null);
    startScan(file);
  };

  const startScan = async (file: File) => {
    setIsScanning(true);
    setScanProgress(language === 'hi' ? 'OCR शुरू हो रहा है...' : 'Initializing OCR...');
    setItems([]);

    try {
      const result = await scanInvoiceImage(
        file,
        existingProducts,
        (progress, status) => {
          setScanProgress(`${status} (${progress}%)`);
        }
      );
      setItems(result.items);
      setRawText(result.rawText);
      if (result.items.length === 0) {
        setErrorMessage(
          language === 'hi'
            ? 'बिल में कोई सामान नहीं मिला। आप मैन्युअल रूप से जोड़ सकते हैं।'
            : 'No items recognized. You can add rows manually.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OCR Scan Failed';
      setErrorMessage(msg);
    } finally {
      setIsScanning(false);
    }
  };

  // Row update handlers
  const handleItemChange = (id: string, field: keyof ParsedInvoiceItem, value: unknown) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // If product selected from dropdown, update matched info
          if (field === 'matchedProductId') {
            const found = existingProducts.find((p) => p.id === value);
            if (found) {
              updated.name = found.name;
              updated.matchedProductName = found.name;
              updated.unit = found.unit;
              updated.status = 'matched';
              updated.isApproved = true;
            } else {
              updated.status = 'unmatched';
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewRow = () => {
    const newItem: ParsedInvoiceItem = {
      id: generateId('manual_row'),
      rawText: 'Manual row',
      name: existingProducts[0]?.name || 'नया सामान',
      quantity: 1,
      unit: existingProducts[0]?.unit || 'packet',
      matchedProductId: existingProducts[0]?.id,
      matchedProductName: existingProducts[0]?.name,
      confidence: 1.0,
      status: 'matched',
      isApproved: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Commit approved items into inventory via the service layer
  const handleConfirmInward = async () => {
    const approvedItems = items.filter((i) => i.isApproved && i.matchedProductId && i.quantity > 0);

    if (approvedItems.length === 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कोई वैध स्वीकृत आइटम नहीं है। कृपया कम से कम 1 आइटम का मिलान करें।'
          : 'No approved items to receive. Match at least 1 product.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onCommitInwardBatch(
        approvedItems.map((item) => ({
          productId: item.matchedProductId!,
          quantity: item.quantity,
          unit: item.unit,
          costPrice: item.costPrice,
        }))
      );
      setSuccessCount(approvedItems.length);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error committing stock';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {language === 'hi' ? 'सप्लायर बिल / पर्ची स्कैनर (OCR)' : 'Invoice & Bill Scanner (OCR)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'hi' ? 'छवि से टेक्स्ट पहचान कर सीधे स्टॉक में जोड़ें' : 'Extract bill items and verify before adding stock'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving || isScanning}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 no-scrollbar pr-1">
          {/* File Picker / Drag Area */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-3xl bg-white text-amber-600 shadow-sm flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900">
                  {language === 'hi' ? 'बिल या पर्ची की फ़ोटो चुनें' : 'Choose or snap an invoice photo'}
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'hi' ? 'JPG, PNG, WebP (अधिकतम 10 MB)' : 'JPG, PNG, WebP (Max 10 MB)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setItems([]);
                }}
                disabled={isScanning || isSaving}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex-shrink-0"
              >
                {language === 'hi' ? 'दूसरी छवि चुनें' : 'Change Image'}
              </button>
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200 text-center space-y-2.5">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-xs font-black text-amber-900">{scanProgress}</p>
              <p className="text-[11px] text-amber-700">
                {language === 'hi' ? 'लोकल WebAssembly OCR इंजन चल रहा है...' : 'Running on-device OCR engine...'}
              </p>
            </div>
          )}

          {/* Success / Error Messages */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <PackageCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-black text-emerald-900">
                {language === 'hi'
                  ? `सफलता! ${successCount} सामान का स्टॉक सफलतापूर्वक जुड़ गया है।`
                  : `Success! ${successCount} items received into inventory.`}
              </div>
            </div>
          )}

          {/* Review Table (Section Requirement) */}
          {items.length > 0 && !isScanning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {language === 'hi' ? 'पहचाने गए सामान की समीक्षा (Review Table)' : 'Extracted Items Review'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {language === 'hi'
                      ? 'अनुमोदन से पहले नाम, मात्रा और इकाई की पुष्टि करें।'
                      : 'Verify matching, quantities, and units before confirming.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewRow}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? '+ पंक्ति जोड़ें' : '+ Add Row'}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[11px]">
                      <tr>
                        <th className="p-3 w-8">✓</th>
                        <th className="p-3">{language === 'hi' ? 'दुकान का सामान (Matched Item)' : 'Matched Product'}</th>
                        <th className="p-3 w-24">{language === 'hi' ? 'आवक मात्रा' : 'Qty'}</th>
                        <th className="p-3 w-28">{language === 'hi' ? 'इकाई' : 'Unit'}</th>
                        <th className="p-3 w-20">{language === 'hi' ? 'रेट (₹)' : 'Rate'}</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const isUncertain = item.status === 'uncertain';
                        const isUnmatched = item.status === 'unmatched';

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isUnmatched
                                ? 'bg-rose-50/30'
                                : isUncertain
                                ? 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={item.isApproved}
                                onChange={(e) => handleItemChange(item.id, 'isApproved', e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Product Selector / Name */}
                            <td className="p-3">
                              <select
                                value={item.matchedProductId || ''}
                                onChange={(e) => handleItemChange(item.id, 'matchedProductId', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                              >
                                <option value="">
                                  {language === 'hi' ? '-- सामान चुनें --' : '-- Select Product --'}
                                </option>
                                {existingProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.unit})
                                  </option>
                                ))}
                              </select>

                              {/* Confidence / Warning Tag */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                                  OCR: "{item.rawText}"
                                </span>
                                {isUncertain && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                                    <HelpCircle className="w-2.5 h-2.5" />
                                    {language === 'hi' ? 'जांचें' : 'Review match'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="p-3">
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={item.quantity || ''}
                                onChange={(e) =>
                                  handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                              />
                            </td>

                            {/* Unit */}
                            <td className="p-3">
                              <select
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemChange(item.id, 'unit', e.target.value as ProductUnit)
                                }
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-slate-700 text-xs"
                              >
                                {AVAILABLE_UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Price */}
                            <td className="p-3">
                              <input
                                type="number"
                                step="any"
                                value={item.costPrice || ''}
                                onChange={(e) =>
                                  handleItemChange(item.id, 'costPrice', parseFloat(e.target.value) || undefined)
                                }
                                placeholder="₹"
                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-semibold text-slate-700 text-xs"
                              />
                            </td>

                            {/* Delete */}
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(item.id)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Toggle Raw Text */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  {showRawText ? 'मूल OCR टेक्स्ट छुपाएं' : 'मूल OCR टेक्स्ट देखें (View raw text)'}
                </button>
                {showRawText && (
                  <pre className="mt-2 p-3 bg-slate-100 rounded-xl text-[10px] text-slate-600 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {rawText || 'कोई टेक्स्ट नहीं'}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            {items.length > 0 && (
              <span>
                {items.filter((i) => i.isApproved && i.matchedProductId).length} / {items.length}{' '}
                {language === 'hi' ? 'आइटम स्वीकृत' : 'items approved'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isScanning}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirmInward}
              disabled={
                isSaving ||
                isScanning ||
                items.filter((i) => i.isApproved && i.matchedProductId).length === 0
              }
              className="px-6 py-2.5 rounded-2xl bg-dukaan-amber-600 hover:bg-dukaan-amber-700 disabled:opacity-40 text-white text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'hi' ? 'स्टॉक जुड़ रहा है...' : 'Adding stock...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'स्टॉक में जोड़ें (Confirm Inward)' : 'Confirm Inward'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

