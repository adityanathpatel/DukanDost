import React, { useState } from 'react';
import { Product } from '@/domain/types';
import { MarketingRequest, MarketingResponse } from '../types';
import { HustleOfflineEngine } from '../services/hustleEngine';
import { hustleRepository } from '../data/hustleRepository';
import { triggerWhatsAppShare } from '@/domain/whatsapp';
import {
  Megaphone,
  Sparkles,
  Copy,
  CheckCircle2,
  Share2,
  BookmarkPlus,
  Clock,
  Package
} from 'lucide-react';

interface MarketingCopyWriterProps {
  products: Product[];
  language: 'hi' | 'en';
}

const CAMPAIGN_PRESETS = [
  {
    name: 'दिवाली महाधमाका (Diwali Festive Offer)',
    item: 'ड्राई फ्रूट्स व मिठाई गिफ्ट बॉक्स / Dry Fruits Box',
    type: 'festival_offer' as const,
    offer: 'फ्लैट 20% छूट + आकर्षक गिफ्ट पैकिंग मुफ्त',
    lang: 'hi' as const,
  },
  {
    name: 'व्हाट्सएप स्पेशल ऑफर (WhatsApp VIP Deal)',
    item: 'प्रीमियम बासमती चावल व देसी घी',
    type: 'whatsapp_promo' as const,
    offer: '5 किलो पर 1 किलो चीनी मुफ्त या ₹100 की सीधी बचत',
    lang: 'hi' as const,
  },
  {
    name: 'वीकेंड राशन सेल (Weekend Grocery Sale)',
    item: 'महीने का पूरा किराना व राशन सामग्री',
    type: 'weekend_sale' as const,
    offer: '₹2000 की खरीदारी पर ₹150 कैशबैक / छूट',
    lang: 'hi' as const,
  },
];

export const MarketingCopyWriter: React.FC<MarketingCopyWriterProps> = ({
  products,
  language,
}) => {
  const [productOrService, setProductOrService] = useState('');
  const [campaignType, setCampaignType] = useState<MarketingRequest['campaignType']>('whatsapp_promo');
  const [offerDetails, setOfferDetails] = useState('');
  const [targetAudience] = useState('मोहल्ले के परिवार व नियमित ग्राहक');
  const [outputLang, setOutputLang] = useState<'hi' | 'en'>('hi');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketingResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadPreset = (p: typeof CAMPAIGN_PRESETS[0]) => {
    setProductOrService(p.item);
    setCampaignType(p.type);
    setOfferDetails(p.offer);
    setOutputLang(p.lang);
  };

  const handleSelectProduct = (p: Product) => {
    const name = language === 'hi' ? p.nameHi || p.name : p.name;
    setProductOrService(name);
    setOfferDetails(`केवल ₹${p.sellingPrice || p.costPrice || 0} प्रति ${p.unit}`);
  };

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productOrService.trim()) return;

    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const res = HustleOfflineEngine.generateMarketing({
        productOrService,
        campaignType,
        offerDetails,
        targetAudience,
        language: outputLang,
      });
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppBroadcast = () => {
    if (!result) return;
    const fullText = `${result.headline}\n\n${result.content}\n\n${result.callToAction}\n\n${result.suggestedHashtags.join(' ')}`;
    triggerWhatsAppShare(fullText);
  };

  const copyFullContent = () => {
    if (!result) return;
    const fullText = `${result.headline}\n\n${result.content}\n\n${result.callToAction}\n\n${result.suggestedHashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToProject = async () => {
    if (!result) return;
    await hustleRepository.saveProject({
      title: `${productOrService} (${campaignType})`,
      toolType: 'marketing',
      content: JSON.stringify(result, null, 2),
      tags: `${campaignType}, promo`,
      isFavorite: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
        <span className="p-2 rounded-2xl bg-pink-500 text-white">
          <Megaphone className="w-5 h-5 stroke-[2.5]" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            {language === 'hi' ? 'मार्केटिंग व प्रचार कॉपीराइटर' : 'Marketing & WhatsApp Copywriter'}
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {language === 'hi'
              ? 'त्योहार, वीकेंड सेल व WhatsApp ब्रॉडकास्ट हेतु तुरंत आकर्षक संदेश तैयार करें'
              : 'Create viral WhatsApp broadcasts, festive sales, and social media campaigns'}
          </p>
        </div>
      </div>

      {/* Preset Strips */}
      <div className="space-y-2">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
          रेडिमेड किराना टेम्पलेट्स (One-Click Presets):
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {CAMPAIGN_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p)}
              className="px-3.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-xs font-bold text-pink-900 flex-shrink-0 transition-colors shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Quick Autofill Strip */}
      {products.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
          <p className="text-[11px] font-black text-slate-600 uppercase flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            स्टॉक आइटम चुनें:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {products.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-500 text-[11px] font-bold text-slate-800 flex-shrink-0"
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
            सामान या सेवा का नाम (Product/Service) *
          </label>
          <input
            type="text"
            required
            placeholder="उदा. फॉर्च्यून रिफाइंड तेल या पूजा सामग्री"
            value={productOrService}
            onChange={(e) => setProductOrService(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-pink-600"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            प्रचार प्रकार (Campaign Type)
          </label>
          <select
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value as any)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-pink-600"
          >
            <option value="whatsapp_promo">व्हाट्सएप ब्रॉडकास्ट (WhatsApp VIP Broadcast)</option>
            <option value="festival_offer">त्योहार डिस्काउंट (Festive Mega Offer)</option>
            <option value="weekend_sale">वीकेंड बंपर सेल (Weekend Clearance)</option>
            <option value="instagram_caption">इंस्टाग्राम व फेसबुक पोस्ट (Social Media Post)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
            ऑफर / छूट का विवरण (Offer Details)
          </label>
          <input
            type="text"
            placeholder="उदा. 20% की छूट या 1 के साथ 1 फ्री"
            value={offerDetails}
            onChange={(e) => setOfferDetails(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-pink-600"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600">भाषा:</span>
            <button
              type="button"
              onClick={() => setOutputLang('hi')}
              className={`px-3 py-1 rounded-xl text-xs font-black ${
                outputLang === 'hi' ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-600'
              }`}
            >
              हिन्दी / हिंग्लिश
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
            disabled={isLoading || !productOrService.trim()}
            className="h-11 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:opacity-90 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/30 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoading ? 'बनाया जा रहा है...' : '✨ प्रचार संदेश बनाएं'}</span>
          </button>
        </div>
      </form>

      {/* Generated Result Card */}
      {result && (
        <div className="mt-6 p-5 sm:p-6 bg-slate-50 border-2 border-pink-200 rounded-3xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-slate-900">
                तैयार प्रचार संदेश (Ready to Broadcast)
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleWhatsAppBroadcast}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp पर ब्रॉडकास्ट करें</span>
              </button>

              <button
                onClick={copyFullContent}
                className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{copied ? 'कॉपी हो गया!' : 'पूरा कॉपी करें'}</span>
              </button>

              <button
                onClick={handleSaveToProject}
                className="h-10 px-3.5 rounded-xl bg-white hover:bg-pink-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-pink-600" />
                <span>{savedSuccess ? 'सेव्ड!' : 'सेव'}</span>
              </button>
            </div>
          </div>

          {/* Headline */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <p className="text-sm sm:text-base font-black text-slate-950">
              {result.headline}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed">
            {result.content}
          </div>

          {/* Call to action & Best Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="font-black text-amber-950 block mb-0.5">कॉल टू एक्शन (CTA):</span>
              <p className="font-bold text-slate-800">{result.callToAction}</p>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2">
              <Clock className="w-4 h-4 text-indigo-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-black text-indigo-950 block mb-0.5">भेजने का सबसे उत्तम समय:</span>
                <p className="font-bold text-slate-800">{result.recommendedTiming}</p>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1.5">
            {result.suggestedHashtags.map((h, i) => (
              <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-pink-700">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
