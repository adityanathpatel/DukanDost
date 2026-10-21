import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle
} from 'lucide-react';
import { Product } from '@/domain/types';
import { ParsedVoiceCommand } from '../types';
import { parseVoiceCommand } from './voiceParser';
import { BrowserSpeechRecognizer, isSpeechRecognitionSupported } from './speechRecognition';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  language: 'hi' | 'en';
  onExecuteSale: (productId: string, quantity: number) => Promise<void>;
  onExecuteInward: (productId: string, quantity: number) => Promise<void>;
  onNavigateToLowStock?: () => void;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  products,
  language,
  onExecuteSale,
  onExecuteInward,
  onNavigateToLowStock,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual override for ambiguous products
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [manualQuantity, setManualQuantity] = useState<string>('');

  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);
  const isSpeechAvailable = isSpeechRecognitionSupported();

  const handleAnalyzeQuery = useCallback((text: string) => {
    if (!text.trim()) return;
    const command = parseVoiceCommand(text, products, language);
    setParsedCommand(command);
    setSelectedProduct(command.matchedProduct || null);
    if (command.quantity) {
      setManualQuantity(command.quantity.toString());
    } else {
      setManualQuantity('');
    }
  }, [products, language]);

  useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      setIsListening(false);
      setParsedCommand(null);
      setInputText('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setSelectedProduct(null);
      setManualQuantity('');
      return;
    }

    // Initialize speech recognizer
    recognizerRef.current = new BrowserSpeechRecognizer({
      onStart: () => {
        setIsListening(true);
        setErrorMessage(null);
      },
      onResult: (transcript, isFinal) => {
        setInputText(transcript);
        if (isFinal) {
          handleAnalyzeQuery(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current.setLanguage(language);

    // Auto-start listening if supported
    if (isSpeechAvailable) {
      recognizerRef.current.start();
    }
  }, [isOpen, language, isSpeechAvailable, handleAnalyzeQuery]);

  const toggleListening = () => {
    if (!recognizerRef.current) return;
    if (isListening) {
      recognizerRef.current.stop();
    } else {
      setErrorMessage(null);
      setSuccessMessage(null);
      recognizerRef.current.start();
    }
  };

  const handleSelectAmbiguousProduct = (prod: Product) => {
    setSelectedProduct(prod);
    if (parsedCommand) {
      setParsedCommand({
        ...parsedCommand,
        matchedProduct: prod,
        ambiguousProducts: undefined,
        productName: language === 'hi' ? prod.nameHi || prod.name : prod.name,
        isComplete: Boolean(parsedCommand.quantity && parsedCommand.quantity > 0),
        actionDescription: language === 'hi'
          ? `${prod.name} चुना गया।`
          : `Selected ${prod.name}.`,
      });
    }
  };

  // Explicit confirmation commit
  const handleConfirmAction = async () => {
    if (!parsedCommand) return;
    const prod = selectedProduct || parsedCommand.matchedProduct;
    const qty = parseFloat(manualQuantity || parsedCommand.quantity?.toString() || '0');

    if (!prod || isNaN(qty) || qty <= 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया मान्य सामान और मात्रा चुनें'
          : 'Please select a valid product and quantity'
      );
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      if (parsedCommand.intent === 'record_sale') {
        await onExecuteSale(prod.id, qty);
        setSuccessMessage(
          language === 'hi'
            ? `✅ ${prod.name} की ${qty} ${prod.unit} बिक्री दर्ज हो गई!`
            : `✅ Sale of ${qty} ${prod.unit} recorded for ${prod.name}!`
        );
      } else if (parsedCommand.intent === 'receive_stock') {
        await onExecuteInward(prod.id, qty);
        setSuccessMessage(
          language === 'hi'
            ? `📦 ${prod.name} में +${qty} ${prod.unit} माल जुड़ गया!`
            : `📦 Added +${qty} ${prod.unit} stock to ${prod.name}!`
        );
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ऑपरेशन विफल हुआ';
      setErrorMessage(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  const samplePrompts = [
    { label: 'दूध माल आवक', query: 'Amul milk ke 10 packet add karo' },
    { label: 'पारले-जी बिक्री', query: 'Parle-G ke 2 packet bech do' },
    { label: 'आटा स्टॉक चेक', query: 'Kitna atta bacha hai?' },
    { label: 'कम स्टॉक सूची', query: 'Kaun se products low stock mein hain?' },
  ];

  if (!isOpen) return null;

  const activeProduct = selectedProduct || parsedCommand?.matchedProduct;
  const activeQty = parseFloat(manualQuantity || parsedCommand?.quantity?.toString() || '0');

  // Low stock products for quick display
  const lowStockItems = products.filter((p) => !p.archived && p.stockQty <= p.minStock);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {language === 'hi' ? 'दुकान वॉइस असिस्टेंट' : 'Voice Assistant (Hindi / Hinglish)'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                {language === 'hi' ? 'बोलकर बिक्री दर्ज करें या स्टॉक जानें' : 'Speak to record sales or check stock'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center transition-transform active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Mic Listening Orb */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center relative overflow-hidden">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-100'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <div className="mt-3 text-xs font-black text-slate-800">
              {isListening
                ? (language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now')
                : (language === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap mic to speak')}
            </div>

            <p className="text-[11px] text-slate-400 font-medium mt-0.5 max-w-xs">
              {language === 'hi'
                ? 'हिन्दी या हिंग्लिश में बोलें (उदा: "Amul milk ke 10 packet add karo")'
                : 'Speak in Hindi or Hinglish (e.g., "Kitna atta bacha hai?")'}
            </p>
          </div>

          {/* Transcript / Input text field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>{language === 'hi' ? 'निर्देश (आवाज़ या टाइप)' : 'Spoken or Typed Command'}</span>
              {!isSpeechAvailable && (
                <span className="text-amber-600 font-bold lowercase flex items-center gap-1">
                  <MicOff className="w-3 h-3" />
                  {language === 'hi' ? 'माइक उपलब्ध नहीं (टाइप करें)' : 'Mic unavailable (type command)'}
                </span>
              )}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleAnalyzeQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAnalyzeQuery(inputText);
                  }
                }}
                placeholder={
                  language === 'hi'
                    ? 'उदा. 2 packet Parle-G bech do...'
                    : 'e.g. Parle-G ke 2 packet bech do...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
              <button
                type="button"
                onClick={() => handleAnalyzeQuery(inputText)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'जांचें' : 'Parse'}</span>
              </button>
            </div>
          </div>

          {/* Sample Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 py-1">
              {language === 'hi' ? 'नमूने:' : 'Examples:'}
            </span>
            {samplePrompts.map((p) => (
              <button
                key={p.query}
                type="button"
                onClick={() => {
                  setInputText(p.query);
                  handleAnalyzeQuery(p.query);
                }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                "{p.query}"
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-black animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Parsed Result Display */}
          {parsedCommand && !successMessage && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              {/* Intent Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 tracking-wider">
                  {parsedCommand.intent === 'record_sale' && (language === 'hi' ? '⚡ बिक्री आदेश' : '⚡ Record Sale')}
                  {parsedCommand.intent === 'receive_stock' && (language === 'hi' ? '📦 माल आवक आदेश' : '📦 Stock Inward')}
                  {parsedCommand.intent === 'stock_lookup' && (language === 'hi' ? '🔍 स्टॉक जानकारी' : '🔍 Stock Lookup')}
                  {parsedCommand.intent === 'low_stock_lookup' && (language === 'hi' ? '⚠️ कम स्टॉक सूची' : '⚠️ Low Stock List')}
                  {parsedCommand.intent === 'unknown' && (language === 'hi' ? '❓ अस्पष्ट आदेश' : '❓ Unknown Command')}
                </span>

                <span className="text-[11px] font-bold text-slate-400">
                  {language === 'hi' ? 'विश्वास स्तर:' : 'Confidence:'} {Math.round(parsedCommand.confidence * 100)}%
                </span>
              </div>

              {/* Action Description */}
              <p className="text-xs font-bold text-slate-800">
                {parsedCommand.actionDescription}
              </p>

              {/* Ambiguous Products Resolution List */}
              {parsedCommand.ambiguousProducts && parsedCommand.ambiguousProducts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'hi' ? 'कृपया इनमें से सही सामान चुनें:' : 'Please choose the exact product:'}</span>
                  </div>

                  <div className="space-y-1">
                    {parsedCommand.ambiguousProducts.map((cand) => (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => handleSelectAmbiguousProduct(cand)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-between transition-all ${
                          selectedProduct?.id === cand.id
                            ? 'bg-violet-50 border-violet-500 text-violet-950'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <span>{language === 'hi' ? cand.nameHi || cand.name : cand.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold ml-2">
                            ({cand.stockQty} {cand.unit})
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Lookup Card Output */}
              {parsedCommand.intent === 'stock_lookup' && activeProduct && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {language === 'hi' ? activeProduct.nameHi || activeProduct.name : activeProduct.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {language === 'hi' ? 'न्यूनतम सीमा:' : 'Min Stock Threshold:'} {activeProduct.minStock} {activeProduct.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-950">
                      {activeProduct.stockQty} {activeProduct.unit}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      activeProduct.stockQty === 0
                        ? 'bg-rose-100 text-rose-800'
                        : activeProduct.stockQty <= activeProduct.minStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeProduct.stockQty === 0 ? 'खत्म' : activeProduct.stockQty <= activeProduct.minStock ? 'कम स्टॉक' : 'पर्याप्त'}
                    </span>
                  </div>
                </div>
              )}

              {/* Low Stock Lookup Card Output */}
              {parsedCommand.intent === 'low_stock_lookup' && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-black text-slate-700">
                    {language === 'hi' 
                      ? `${lowStockItems.length} सामान कम या खत्म स्टॉक में हैं:` 
                      : `${lowStockItems.length} products currently low or out of stock:`}
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs font-bold"
                      >
                        <span className="text-slate-900">
                          {language === 'hi' ? item.nameHi || item.name : item.name}
                        </span>
                        <span className="text-rose-700 font-extrabold">
                          {item.stockQty} / {item.minStock} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {onNavigateToLowStock && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToLowStock();
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>{language === 'hi' ? 'रीऑर्डर शीट खोलें' : 'Open Reorder Sheet'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* EXPLICIT CONFIRMATION CARD FOR INVENTORY CHANGES */}
              {(parsedCommand.intent === 'record_sale' || parsedCommand.intent === 'receive_stock') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {language === 'hi' ? 'पुष्टि विवरण (Confirm Transaction)' : 'Transaction Summary'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {language === 'hi' ? 'स्थानीय IndexedDB में दर्ज होगा' : 'Will write to local IndexedDB'}
                    </span>
                  </div>

                  {/* Quantity input if missing or to adjust */}
                  <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700">
                      {parsedCommand.intent === 'record_sale'
                        ? (language === 'hi' ? 'बिक्री मात्रा:' : 'Sale Qty:')
                        : (language === 'hi' ? 'आवक मात्रा:' : 'Inward Qty:')}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={manualQuantity}
                        onChange={(e) => setManualQuantity(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-right text-xs font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <span className="text-xs font-extrabold text-slate-600">
                        {parsedCommand.unit || activeProduct?.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  {/* Stock impact breakdown */}
                  {activeProduct && activeQty > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400">
                          {language === 'hi' ? 'मौजूदा स्टॉक' : 'Current'}
                        </div>
                        <div className="font-black text-slate-800">
                          {activeProduct.stockQty} {activeProduct.unit}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400">
                          {parsedCommand.intent === 'record_sale' ? (language === 'hi' ? 'बिक्री' : 'Sale') : (language === 'hi' ? 'आवक' : 'Inward')}
                        </div>
                        <div className={`font-black ${parsedCommand.intent === 'record_sale' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {parsedCommand.intent === 'record_sale' ? `-${activeQty}` : `+${activeQty}`} {activeProduct.unit}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400">
                          {language === 'hi' ? 'नया स्टॉक' : 'New Stock'}
                        </div>
                        <div className="font-black text-slate-900">
                          {parsedCommand.intent === 'record_sale'
                            ? Math.max(0, Math.round((activeProduct.stockQty - activeQty) * 1000) / 1000)
                            : Math.round((activeProduct.stockQty + activeQty) * 1000) / 1000}{' '}
                          {activeProduct.unit}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setParsedCommand(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-black transition-colors"
                      disabled={isExecuting}
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmAction}
                      disabled={isExecuting || !activeProduct || activeQty <= 0}
                      className={`flex-1 py-2.5 rounded-xl text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                        isExecuting || !activeProduct || activeQty <= 0
                          ? 'bg-slate-300 cursor-not-allowed'
                          : parsedCommand.intent === 'record_sale'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{language === 'hi' ? 'दर्ज हो रहा है...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {parsedCommand.intent === 'record_sale'
                              ? (language === 'hi' ? 'हाँ, बिक्री दर्ज करें' : 'Confirm Sale')
                              : (language === 'hi' ? 'हाँ, माल जोड़ें' : 'Confirm Inward')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-400">
            {language === 'hi'
              ? '🔒 कोई डेटा बाहरी सर्वर पर नहीं भेजा जाता। सभी गणना स्थानीय है।'
              : '🔒 100% Client-side speech parsing. Zero external audio transmission.'}
          </p>
        </div>
      </div>
    </div>
  );
};
