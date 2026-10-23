import React, { useState } from 'react';
import { EmailRequest, EmailResponse } from '../types';
import { HustleOfflineEngine } from '../services/hustleEngine';
import { hustleRepository } from '../data/hustleRepository';
import { triggerWhatsAppShare } from '@/domain/whatsapp';
import {
  Mail,
  Sparkles,
  Copy,
  CheckCircle2,
  Share2,
  BookmarkPlus,
  Phone,
  User
} from 'lucide-react';

interface CustomerReminderWriterProps {
  language: 'hi' | 'en';
}

export const CustomerReminderWriter: React.FC<CustomerReminderWriterProps> = ({
  language,
}) => {
  const [emailType, setEmailType] = useState<EmailRequest['emailType']>('payment_reminder');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [dueAmount, setDueAmount] = useState<number | ''>('');
  const [keyDetails, setKeyDetails] = useState('');
  const [outputLang, setOutputLang] = useState<'hi' | 'en'>('hi');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recipientName.trim()) return;

    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const res = HustleOfflineEngine.generateEmailOrReminder({
        emailType,
        recipientName,
        recipientPhone,
        subjectContext: emailType === 'payment_reminder' ? 'उधार खाता बकाया' : 'सामान आपूर्ति',
        keyDetails: keyDetails || (dueAmount ? `बकाया राशि: ₹${dueAmount}` : 'दुकान से लिया गया राशन'),
        dueAmount: dueAmount === '' ? undefined : Number(dueAmount),
        language: outputLang,
      });
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!result) return;
    triggerWhatsAppShare(result.whatsappMessage, recipientPhone);
  };

  const copyWhatsAppText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToProject = async () => {
    if (!result) return;
    await hustleRepository.saveProject({
      title: `${recipientName} - ${emailType}`,
      toolType: 'email',
      content: JSON.stringify(result, null, 2),
      tags: `${emailType}, reminder`,
      isFavorite: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
        <span className="p-2 rounded-2xl bg-amber-500 text-slate-950">
          <Mail className="w-5 h-5 stroke-[2.5]" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            {language === 'hi' ? 'उधार तकादा व बिजनेस संदेश राइटर' : 'Customer Reminders & Business Messenger'}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {language === 'hi'
              ? 'उधार ग्राहकों को तकादा संदेश, थोक ग्राहकों को कोटेशन व सप्लायर आर्डर तैयार करें'
              : 'Generate polite credit payment reminders, customer estimates, and supplier requests'}
          </p>
        </div>
      </div>

      {/* Mode Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          { id: 'payment_reminder' as const, label: '💰 उधार तकादा (Payment Reminder)', desc: 'ग्राहक के बकाया खाते का संदेश' },
          { id: 'quotation' as const, label: '📝 कोटेशन / अनुमान (Quotation)', desc: 'शादी, पार्टी या थोक खरीदारी का रेट' },
          { id: 'supplier_order' as const, label: '📦 सप्लायर माल आर्डर (Supplier Order)', desc: 'डिस्ट्रीब्यूटर को नए माल का संदेश' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setEmailType(tab.id)}
            className={`p-3 rounded-2xl text-left border transition-all ${
              emailType === tab.id
                ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-amber-400'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <p className="text-xs font-black">{tab.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            {emailType === 'supplier_order' ? 'सप्लायर / डीलर का नाम *' : 'ग्राहक का नाम (Customer Name) *'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder={emailType === 'supplier_order' ? 'उदा. गुप्ता एजेंसीज' : 'उदा. सुरेश वर्मा'}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            फोन नंबर (WhatsApp भेजने हेतु)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-amber-500"
            />
          </div>
        </div>

        {emailType === 'payment_reminder' && (
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              बकाया राशि (Due Amount ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">₹</span>
              <input
                type="number"
                placeholder="उदा. 1450"
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-amber-500"
              />
            </div>
          </div>
        )}

        <div className={emailType === 'payment_reminder' ? '' : 'sm:col-span-2'}>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            {emailType === 'payment_reminder' ? 'खाता विवरण (Details)' : 'सामान सूची / विवरण (Item Details)'}
          </label>
          <input
            type="text"
            placeholder={
              emailType === 'payment_reminder'
                ? 'उदा. 15 अक्टूबर का राशन बिल'
                : 'उदा. 5 बोरी बासमती, 10 कार्टन तेल, 50 किलो चीनी'
            }
            value={keyDetails}
            onChange={(e) => setKeyDetails(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-amber-500"
          />
        </div>

        <div className="sm:col-span-2 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600">भाषा:</span>
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
            disabled={isLoading || !recipientName.trim()}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-90 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isLoading ? 'ड्राफ्ट हो रहा है...' : '✨ संदेश तैयार करें'}</span>
          </button>
        </div>
      </form>

      {/* Generated Result Card */}
      {result && (
        <div className="mt-6 p-5 sm:p-6 bg-slate-50 border-2 border-amber-300 rounded-3xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-slate-900">
                तैयार WhatsApp व SMS संदेश
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendWhatsApp}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp पर भेजें</span>
              </button>

              <button
                onClick={copyWhatsAppText}
                className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{copied ? 'कॉपी हुआ!' : 'कॉपी संदेश'}</span>
              </button>

              <button
                onClick={handleSaveToProject}
                className="h-10 px-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-600" />
                <span>{savedSuccess ? 'सेव्ड!' : 'सेव'}</span>
              </button>
            </div>
          </div>

          {/* Subject Line */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-black text-slate-800">
            विषय (Subject): {result.subjectLine}
          </div>

          {/* WhatsApp message block */}
          <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 text-xs sm:text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed shadow-xs">
            <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              WhatsApp संदेश प्रीव्यू:
            </div>
            {result.whatsappMessage}
          </div>

          {/* Formal Body block */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
            <p className="font-bold text-slate-900 mb-2">{result.salutation}</p>
            <p>{result.body}</p>
            <p className="mt-3 font-bold text-slate-900">{result.signOff}</p>
          </div>
        </div>
      )}
    </div>
  );
};
