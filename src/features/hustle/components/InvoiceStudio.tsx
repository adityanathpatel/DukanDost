import React, { useState, useEffect } from 'react';
import { Product, ProductUnit } from '@/domain/types';
import { useAuth } from '@/features/auth';
import { DukanInvoice, InvoiceItem, InvoicePaymentMode, InvoiceStatus } from '../types';
import { calculateInvoiceTotals, formatInvoiceWhatsAppMessage } from '../services/hustleEngine';
import { hustleRepository } from '../data/hustleRepository';
import { PrintableInvoiceModal } from './PrintableInvoiceModal';
import { triggerWhatsAppShare } from '@/domain/whatsapp';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Save,
  Share2,
  Package,
  ChevronDown
} from 'lucide-react';

interface InvoiceStudioProps {
  products: Product[];
  language: 'hi' | 'en';
  onRecordSale?: (productId: string, quantity: number) => Promise<void>;
  onInvoiceSaved?: (invoice: DukanInvoice) => void;
}

export const InvoiceStudio: React.FC<InvoiceStudioProps> = ({
  products,
  language,
  onRecordSale,
  onInvoiceSaved,
}) => {
  const { storeName, profile } = useAuth();

  // Invoice identification
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Seller Details
  const [sellerName, setSellerName] = useState(storeName || 'शर्मा किराना स्टोर');
  const sellerShopkeeper = profile?.shopkeeperName || 'रमेश शर्मा';
  const sellerPhone = profile?.phone || '9876543210';
  const sellerAddress = profile?.storeAddress || 'मेन मार्केट, चौक चौराहा';
  const sellerGstin = profile?.gstin || '';
  const [sellerUpiId, setSellerUpiId] = useState(
    profile?.phone ? `${profile.phone}@upi` : 'sharmakirana@upi'
  );

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: 'ताज़ा आटा / Wheat Flour 5kg',
      quantity: 1,
      unit: 'packet',
      unitPrice: 210,
      lineTotal: 210,
    },
  ]);

  // Financials
  const [currency] = useState('INR');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<InvoicePaymentMode>('cash');
  const [status, setStatus] = useState<InvoiceStatus>('paid');
  const [notes] = useState('सामान बिक्री पक्का बिल।');
  const [deductStock, setDeductStock] = useState<boolean>(true);

  // Computed Totals
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Modals & UI Feedback
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<DukanInvoice | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showInventoryPickerIndex, setShowInventoryPickerIndex] = useState<number | null>(null);

  const showFeedback = (text: string, isError = false) => {
    setFeedbackMsg({ text, isError });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Recalculate deterministic totals
  useEffect(() => {
    const calc = calculateInvoiceTotals(items, taxRatePercent, discountAmount);
    setSubtotal(calc.subtotal);
    setTaxAmount(calc.taxAmount);
    setTotalAmount(calc.totalAmount);
  }, [items, taxRatePercent, discountAmount]);

  // Add Item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unit: 'piece',
        unitPrice: 50,
        lineTotal: 50,
      },
    ]);
  };

  // Select Item from Store Inventory
  const handleSelectFromInventory = (index: number, product: Product) => {
    const updated = [...items];
    const price = product.sellingPrice || product.costPrice || 0;
    const prodName = language === 'hi' ? product.nameHi || product.name : product.name;
    const qty = updated[index].quantity > 0 ? updated[index].quantity : 1;

    updated[index] = {
      ...updated[index],
      productId: product.id,
      description: prodName,
      unit: product.unit,
      unitPrice: price,
      lineTotal: Math.round(qty * price * 100) / 100,
    };
    setItems(updated);
    setShowInventoryPickerIndex(null);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    updated[index].lineTotal = Math.round(qty * price * 100) / 100;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showFeedback(language === 'hi' ? 'बिल में कम से कम 1 सामान होना आवश्यक है' : 'Invoice must have at least 1 item', true);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const buildCurrentInvoiceObject = (): DukanInvoice => {
    return {
      id: invoiceId || `inv_${Date.now()}`,
      invoiceNumber,
      issueDate,
      sellerName: sellerName.trim() || 'दुकान दोस्त',
      sellerShopkeeper: sellerShopkeeper.trim(),
      sellerPhone: sellerPhone.trim(),
      sellerAddress: sellerAddress.trim(),
      sellerGstin: sellerGstin.trim(),
      sellerUpiId: sellerUpiId.trim(),
      customerName: customerName.trim() || (language === 'hi' ? 'दुकान ग्राहक' : 'Store Customer'),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      currency,
      subtotal,
      discountAmount,
      taxRatePercent,
      taxAmount,
      totalAmount,
      paymentMode,
      status,
      notes,
      items,
      deductedFromStock: deductStock,
      createdAt: Date.now(),
    };
  };

  const handleSaveInvoice = async () => {
    if (items.some((it) => !it.description.trim())) {
      showFeedback(language === 'hi' ? 'कृपया सभी सामानों का नाम भरें' : 'Please fill all item descriptions', true);
      return;
    }

    setIsSaving(true);
    try {
      const invoicePayload = buildCurrentInvoiceObject();
      const saved = await hustleRepository.saveInvoice(invoicePayload);
      setInvoiceId(saved.id);

      // Optionally deduct items from store stock atomically
      if (deductStock && onRecordSale) {
        for (const it of items) {
          if (it.productId && it.quantity > 0) {
            try {
              await onRecordSale(it.productId, it.quantity);
            } catch (err) {
              console.warn('Could not auto-deduct stock for', it.description, err);
            }
          }
        }
      }

      showFeedback(
        language === 'hi'
          ? `✅ बिल #${saved.invoiceNumber} सुरक्षित हो गया! कुल: ₹${saved.totalAmount}`
          : `✅ Bill #${saved.invoiceNumber} saved! Total: ₹${saved.totalAmount}`
      );
      if (onInvoiceSaved) onInvoiceSaved(saved);
      return saved;
    } catch (err: any) {
      showFeedback(err.message || 'बिल सुरक्षित करने में त्रुटि', true);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPreview = () => {
    const inv = buildCurrentInvoiceObject();
    setActiveInvoiceForModal(inv);
    setIsPreviewModalOpen(true);
  };

  const handleDirectWhatsAppShare = async () => {
    const inv = buildCurrentInvoiceObject();
    const text = formatInvoiceWhatsAppMessage(inv);
    triggerWhatsAppShare(text, customerPhone);
    showFeedback(language === 'hi' ? 'व्हाट्सएप बिल तैयार व भेजा गया!' : 'WhatsApp bill triggered!');
  };

  const handleResetForNewBill = () => {
    setInvoiceId(undefined);
    setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItems([
      {
        description: '',
        quantity: 1,
        unit: 'piece',
        unitPrice: 50,
        lineTotal: 50,
      },
    ]);
    setDiscountAmount(0);
    setTaxRatePercent(0);
    setStatus('paid');
    setPaymentMode('cash');
    showFeedback(language === 'hi' ? 'नया बिल फॉर्म तैयार है' : 'New invoice ready');
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-between shadow-lg transition-all ${
            feedbackMsg.isError
              ? 'bg-rose-500 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="ml-3 font-bold">✕</button>
        </div>
      )}

      {/* Main Billing Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-amber-400 text-slate-950">
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {language === 'hi' ? 'बिल व चालान जनरेटर (Invoice Studio)' : 'Invoice & Bill Studio'}
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {language === 'hi'
                    ? 'दुकान का पक्का/कच्चा बिल बनाएं, प्रिंट करें व WhatsApp पर भेजें'
                    : 'Deterministic billing, PDF export, and WhatsApp instant sharing'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetForNewBill}
              className="h-10 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all"
            >
              + नया बिल (New)
            </button>

            <button
              onClick={handleOpenPreview}
              className="h-10 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'प्रिंट / PDF देखें' : 'Preview & Print'}</span>
            </button>

            <button
              onClick={handleDirectWhatsAppShare}
              className="h-10 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleSaveInvoice}
              disabled={isSaving}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'बिल सेव करें'}</span>
            </button>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'बिल संख्या (Invoice #)' : 'Invoice #'}
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'दिनांक (Date)' : 'Issue Date'}
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'दुकानदार / स्टोर का नाम' : 'Store Name'}
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>
        </div>

        {/* Customer Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'ग्राहक का नाम *' : 'Customer Name *'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'उदा. राजेश कुमार' : 'e.g. John Doe'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'ग्राहक फोन (WhatsApp बिल हेतु)' : 'Customer Phone (for WhatsApp)'}
            </label>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
              {language === 'hi' ? 'पता / मोहल्ला' : 'Customer Address / Area'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'वार्ड 4, चौक' : 'Street / Area'}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-indigo-600"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'सामान सूची (Line Items)' : 'Bill Items'}
            </h3>
            <button
              onClick={handleAddItem}
              className="h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '+ सामान जोड़ें' : '+ Add Item'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="relative p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3"
              >
                {/* Item description + Inventory Picker */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'सामान का नाम (उदा. बासमती चावल)' : 'Item description'}
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-indigo-600"
                    />

                    {/* Inventory Picker Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowInventoryPickerIndex(showInventoryPickerIndex === idx ? null : idx)
                      }
                      className="h-9 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black flex items-center gap-1 flex-shrink-0"
                      title="दुकान स्टॉक से चुनें"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">स्टॉक से</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dropdown list of store products */}
                  {showInventoryPickerIndex === idx && (
                    <div className="absolute top-11 left-0 right-0 z-30 bg-white border-2 border-amber-400 rounded-2xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1">
                      <div className="px-2 py-1 text-[11px] font-black text-slate-500 uppercase">
                        दुकान इन्वेंट्री से सामान चुनें ({products.length} उपलब्ध):
                      </div>
                      {products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectFromInventory(idx, p)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
                        >
                          <div>
                            <span className="font-extrabold">{language === 'hi' ? p.nameHi || p.name : p.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({p.stockQty} {p.unit} उपलब्ध)</span>
                          </div>
                          <span className="font-mono text-emerald-700 font-black">
                            ₹{p.sellingPrice || p.costPrice || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="w-full md:w-28 flex items-center gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase md:hidden">मात्रा:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono font-black text-slate-900 text-center"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value as ProductUnit)}
                    className="bg-white border border-slate-300 rounded-xl px-1.5 py-2 text-[11px] font-bold text-slate-700"
                  >
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="bottle">bottle</option>
                    <option value="box">box</option>
                  </select>
                </div>

                {/* Unit Price */}
                <div className="w-full md:w-28 flex items-center gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase md:hidden">दर (₹):</span>
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-6 pr-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Line Total */}
                <div className="w-full md:w-28 flex items-center justify-between md:justify-end gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase md:hidden">योग:</span>
                  <span className="font-mono text-sm font-black text-slate-950">
                    ₹{item.lineTotal.toFixed(2)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end md:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Adjustment & Mode Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          {/* Left: Payment Options & Sync Check */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                {language === 'hi' ? 'भुगतान माध्यम (Payment Mode)' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['cash', 'upi', 'udhaar', 'card'] as InvoicePaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMode(mode);
                      if (mode === 'udhaar') setStatus('pending');
                      else setStatus('paid');
                    }}
                    className={`py-2 px-1 rounded-2xl text-xs font-black capitalize transition-all border ${
                      paymentMode === mode
                        ? 'bg-slate-950 text-amber-300 border-slate-950 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'cash' ? 'नकद (Cash)' : mode === 'upi' ? 'UPI' : mode === 'udhaar' ? 'उधार (Khata)' : 'Card'}
                  </button>
                ))}
              </div>
            </div>

            {/* Deduct from Stock checkbox */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
              <input
                type="checkbox"
                id="deductStockCheckbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="deductStockCheckbox" className="text-xs font-bold text-slate-900 cursor-pointer">
                {language === 'hi'
                  ? '📦 बिल बनते ही सामान इन्वेंट्री स्टॉक से घटाएं (Auto-Deduct Stock)'
                  : 'Deduct linked items from store inventory upon saving'}
              </label>
            </div>

            {/* Seller UPI for Customer QR */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                दुकान UPI ID (ग्राहक QR / ऑनलाइन भुगतान हेतु)
              </label>
              <input
                type="text"
                value={sellerUpiId}
                onChange={(e) => setSellerUpiId(e.target.value)}
                placeholder="store@upi"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Right: Calculations */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">कुल योग (Subtotal):</span>
              <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-600">विशेष छूट (Discount ₹):</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-mono font-bold text-right text-emerald-700"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-600">GST कर (Tax %):</label>
              <select
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                className="bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-bold text-slate-800"
              >
                <option value={0}>0% (कच्चा/किराना)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>GST राशि:</span>
                <span className="font-mono font-bold text-slate-900">+₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center">
              <span className="text-base font-black text-slate-950">अंतिम देय राशि:</span>
              <span className="text-2xl font-black font-mono text-indigo-950">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      <PrintableInvoiceModal
        invoice={activeInvoiceForModal}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        language={language}
      />
    </div>
  );
};
