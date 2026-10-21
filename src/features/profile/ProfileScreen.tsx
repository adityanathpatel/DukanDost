import React from 'react';
import { Store, ShieldCheck, Globe, RotateCcw, Smartphone } from 'lucide-react';

interface ProfileScreenProps {
  language: 'hi' | 'en';
  onToggleLanguage: () => void;
  onResetData: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onToggleLanguage,
  onResetData,
}) => {
  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Shop Identity Card */}
      <div className="bg-gradient-to-br from-pastel-lavender-light to-pastel-lavender border border-pastel-lavender-border rounded-4xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-3xl bg-navy-900 text-white flex items-center justify-center shadow-md">
            <Store className="w-7 h-7 text-pastel-lavender-border" />
          </div>
          <div>
            <span className="text-xs font-black text-pastel-lavender-text tracking-wide uppercase">
              {language === 'hi' ? 'किराना व जनरल स्टोर' : 'Retail Store'}
            </span>
            <h2 className="text-xl font-black text-ink">
              {language === 'hi' ? 'शर्मा किराना स्टोर' : 'Sharma Kirana Store'}
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              {language === 'hi' ? 'दुकानदार: रमेश शर्मा' : 'Owner: Ramesh Sharma'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings / Controls */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm divide-y divide-stone-100">
        {/* Language switch */}
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-ink">
                {language === 'hi' ? 'ऐप की भाषा' : 'App Language'}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {language === 'hi' ? 'वर्तमान: हिन्दी' : 'Current: English'}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleLanguage}
            className="px-4 py-2 rounded-xl bg-navy-900 text-white font-black text-xs shadow-sm active:scale-95 transition-all"
          >
            {language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
          </button>
        </div>

        {/* Offline & Data Security */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-ink flex items-center gap-1.5">
              <span>{language === 'hi' ? 'डेटा डिवाइस पर सुरक्षित' : 'Local Data Safety'}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {language === 'hi'
                ? 'आपका सारा हिसाब इसी फोन के IndexedDB में सुरक्षित रहता है। इंटरनेट बंद होने पर या हवाई जहाज़ मोड (Airplane Mode) में भी सब काम करता है।'
                : 'All your stock data lives securely inside this device’s local storage. Fully works without internet or in Airplane Mode.'}
            </p>
          </div>
        </div>

        {/* Device test note */}
        <div className="py-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-ink">
              {language === 'hi' ? 'एक हाथ से उपयोग के लिए अनुकूलित' : 'One-Handed Mobile UX'}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {language === 'hi'
                ? 'बटन और नेविगेशन बार को अंगूठे की पहुंच में रखा गया है ताकि ग्राहक को सामान देते हुए भी आसानी से उपयोग हो।'
                : 'All primary actions and navigation are thumb-reachable so you can operate one-handed while serving customers.'}
            </p>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Button */}
      <div className="pt-2">
        <button
          onClick={onResetData}
          className="w-full py-3.5 px-4 rounded-2xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>
            {language === 'hi' ? 'डेमो डेटा रीसेट करें (Reset Sample Data)' : 'Reset Sample Data'}
          </span>
        </button>
      </div>
    </div>
  );
};
