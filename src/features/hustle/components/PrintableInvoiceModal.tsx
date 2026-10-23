import React, { useRef } from 'react';
import { DukanInvoice } from '../types';
import { formatInvoiceWhatsAppMessage } from '../services/hustleEngine';
import { triggerWhatsAppShare } from '@/domain/whatsapp';
import { 
  Printer, 
  Share2, 
  Copy, 
  X, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  QrCode,
  FileText
} from 'lucide-react';

interface PrintableInvoiceModalProps {
  invoice: DukanInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  language,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !invoice) return null;

  const currencySymbol = invoice.currency === 'INR' ? '₹' : invoice.currency;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = formatInvoiceWhatsAppMessage(invoice);
    triggerWhatsAppShare(text, invoice.customerPhone);
  };

  const handleCopy = () => {
    const text = formatInvoiceWhatsAppMessage(invoice);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-lg">
              {language === 'hi' ? 'दुकान बिल रसीद' : 'Store Tax Invoice'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Bill Paper Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-900 bg-white" ref={printAreaRef}>
          {/* Printable Invoice Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                {invoice.sellerName}
              </h2>
              {invoice.sellerShopkeeper && (
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  संचालक: {invoice.sellerShopkeeper}
                </p>
              )}
              {invoice.sellerAddress && (
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  {invoice.sellerAddress}
                </p>
              )}
              {invoice.sellerPhone && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  मो: {invoice.sellerPhone}
                </p>
              )}
              {invoice.sellerGstin && (
                <p className="text-[11px] font-bold text-slate-800 mt-1">
                  GSTIN: <span className="font-mono">{invoice.sellerGstin}</span>
                </p>
              )}
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                {invoice.status === 'paid' ? 'PAID / नकद प्राप्त' : 'INVOICE / बिल'}
              </span>
              <p className="text-xs font-bold text-slate-500">बिल संख्या / Invoice #</p>
              <p className="font-mono text-base font-black text-slate-950">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-1">
                दिनांक: <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
              </p>
            </div>
          </div>

          {/* Customer & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs mb-6">
            <div>
              <p className="font-black text-slate-500 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'ग्राहक का विवरण' : 'Billed To'}
              </p>
              <p className="font-bold text-slate-900 text-sm">{invoice.customerName}</p>
              {invoice.customerPhone && (
                <p className="text-slate-600 mt-0.5">फोन: {invoice.customerPhone}</p>
              )}
              {invoice.customerAddress && (
                <p className="text-slate-600 mt-0.5">पता: {invoice.customerAddress}</p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="font-black text-slate-500 uppercase tracking-wider mb-1">
                {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
              </p>
              <p className="font-bold text-slate-900 capitalize">
                माध्यम: {invoice.paymentMode === 'upi' ? 'UPI (PhonePe/GPay)' : invoice.paymentMode === 'udhaar' ? 'उधार (Khata)' : 'नकद (Cash)'}
              </p>
              <p className="text-slate-600 mt-0.5">
                स्थिति: <span className={invoice.status === 'paid' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {invoice.status.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 uppercase tracking-wider font-black">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">सामान विवरण (Item)</th>
                  <th className="py-2.5 px-3 text-center">मात्रा (Qty)</th>
                  <th className="py-2.5 px-3 text-right">दर (Rate)</th>
                  <th className="py-2.5 px-3 text-right">कुल (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                      {currencySymbol}{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                      {currencySymbol}{item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t-2 border-slate-900 pt-4">
            <div className="text-xs text-slate-600 max-w-xs">
              {invoice.sellerUpiId && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-indigo-700 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-indigo-900">UPI भुगतान करें:</p>
                    <p className="font-mono text-[11px] font-black text-indigo-950">{invoice.sellerUpiId}</p>
                  </div>
                </div>
              )}
              {invoice.notes && (
                <p className="italic text-slate-500">नोट: {invoice.notes}</p>
              )}
              <p className="mt-2 text-[11px] text-slate-400 font-semibold">
                * यह कंप्यूटर जनित रसीद है। सामान की शुद्धता व गुणवत्ता की गारंटी।
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>कुल योग (Subtotal):</span>
                <span className="font-mono font-bold text-slate-900">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>छूट (Discount):</span>
                  <span className="font-mono">-{currencySymbol}{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({invoice.taxRatePercent}%):</span>
                  <span className="font-mono font-bold text-slate-900">+{currencySymbol}{invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-950 border-t-2 border-slate-900 pt-2 mt-2">
                <span>अंतिम देय राशि:</span>
                <span className="font-mono text-lg font-black text-indigo-950">
                  {currencySymbol}{invoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp पर भेजें</span>
            </button>
            <button
              onClick={handleCopy}
              className="h-11 px-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'कॉपी हो गया' : 'कॉपी बिल'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-11 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>{language === 'hi' ? 'प्रिंट / PDF डाउनलोड' : 'Print / Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="h-11 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm active:scale-95 transition-all"
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
