import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  Globe,
  RotateCcw,
  Smartphone,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  FileText,
  Mail,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/features/auth';

interface ProfileScreenProps {
  language: 'hi' | 'en';
  onToggleLanguage: () => void;
  onResetData: () => void;
  onOpenAuth?: () => void;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncedAt?: number | null;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onToggleLanguage,
  onResetData,
  onOpenAuth,
  onSyncNow,
  isSyncing = false,
  lastSyncedAt = null,
}) => {
  const { user, logOut, storeName, profile } = useAuth();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncClick = async () => {
    if (!onSyncNow) return;
    try {
      await onSyncNow();
      setSyncFeedback(language === 'hi' ? 'क्लाउड सिंक सफल!' : 'Cloud sync successful!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch {
      setSyncFeedback(language === 'hi' ? 'सिंक विफल रहा।' : 'Sync failed.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) {
      return language === 'hi' ? 'अभी तक सिंक नहीं हुआ' : 'Not yet synced';
    }
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return language === 'hi' ? 'अभी-अभी' : 'Just now';
    if (diffMins < 60) return language === 'hi' ? `${diffMins} मिनट पहले` : `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return language === 'hi' ? `${diffHours} घंटे पहले` : `${diffHours}h ago`;
  };

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Comprehensive Shopkeeper Identity Card */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-stone-50 border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Store className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  {profile?.storeCategory || (language === 'hi' ? 'किराना / ग्रोसरी' : 'Kirana / Grocery')}
                </span>
                {user ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {language === 'hi' ? 'क्लाउड सिंक सक्रिय' : 'Cloud Synced'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                    {language === 'hi' ? 'ऑफ़लाइन सक्रिय' : 'Local Offline'}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {storeName}
              </h2>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {profile?.shopkeeperName
                    ? `${language === 'hi' ? 'मालिक:' : 'Owner:'} ${profile.shopkeeperName}`
                    : (language === 'hi' ? 'अतिथि दुकानदार' : 'Guest Shopkeeper')}
                </span>
              </p>
            </div>
          </div>

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-all active:scale-95"
              title={language === 'hi' ? 'विवरण बदलें' : 'Edit details'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-stone-100 text-xs text-slate-600 font-medium">
          {/* Phone */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
            <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? 'फ़ोन नंबर' : 'Phone'}
              </div>
              <div className="font-extrabold text-slate-800">
                +91 {profile?.phone || '9876543210'}
              </div>
            </div>
          </div>

          {/* Location & Pincode */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
            <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? 'पता व पिनकोड' : 'Address & Pincode'}
              </div>
              <div className="font-extrabold text-slate-800 truncate">
                {profile?.storeAddress ? `${profile.storeAddress} (${profile.pincode})` : 'चौक, 226001'}
              </div>
            </div>
          </div>

          {/* GSTIN (if provided) */}
          {profile?.gstin && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 sm:col-span-2">
              <FileText className="w-4 h-4 text-violet-600 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">GSTIN</div>
                <div className="font-mono font-extrabold text-slate-800 tracking-wider">
                  {profile.gstin}
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 sm:col-span-2">
            <Mail className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <div className="truncate">
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? 'ईमेल खाता' : 'Email'}
              </div>
              <div className="font-bold text-slate-800 truncate">
                {user?.email || profile?.email || 'sharma.kirana@dukandost.in'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Sync & Auth Section */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-ink">
                {language === 'hi' ? 'Firebase क्लाउड डेटाबेस' : 'Firebase Cloud Sync'}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {user 
                  ? (language === 'hi' ? `सिंक स्थिति: ${formatLastSync(lastSyncedAt)}` : `Status: ${formatLastSync(lastSyncedAt)}`)
                  : (language === 'hi' ? 'क्लाउड बैकअप के लिए लॉगिन करें' : 'Sign in to enable cloud backup')}
              </div>
            </div>
          </div>

          {user ? (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (language === 'hi' ? 'सिंक जारी...' : 'Syncing...') : (language === 'hi' ? 'अभी सिंक करें' : 'Sync Now')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'दुकानदार लॉगिन' : 'Shopkeeper Login'}</span>
            </button>
          )}
        </div>

        {syncFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {(user || profile) && (
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {profile?.shopkeeperName || user?.email}
            </span>
            <button
              onClick={async () => {
                await logOut();
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'लॉग आउट (Sign Out)' : 'Sign Out'}</span>
            </button>
          </div>
        )}
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
            className="px-4 py-2 rounded-xl bg-[#0F172A] text-white font-black text-xs shadow-sm active:scale-95 transition-all"
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
              <span>{language === 'hi' ? 'स्थानीय व क्लाउड सुरक्षा' : 'Offline & Cloud Safety'}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                Local-First
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {language === 'hi'
                ? 'दुकान दोस्त में आपका हिसाब पहले IndexedDB में स्थानीय रूप से सहेजा जाता है। जब इंटरनेट चालू होता है और आप लॉगिन होते हैं, तो Firebase डेटाबेस में सुरक्षित बैकअप रहता है।'
                : 'In Dukan Dost, all stock records are saved locally in IndexedDB first. When online and signed in, data seamlessly syncs with your Firebase cloud database.'}
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
