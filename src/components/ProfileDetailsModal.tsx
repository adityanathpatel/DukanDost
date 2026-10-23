import React from 'react';
import { useAuth } from '@/features/auth';
import {
  X,
  Store,
  User,
  Phone,
  MapPin,
  FileText,
  Mail,
  Cloud,
  WifiOff,
  LogOut,
  Edit3,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Zap,
  Pill,
  Shirt,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { NavigationTab } from './Navigation';

interface ProfileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hi' | 'en';
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenEditAuth: () => void;
  onTriggerDemo: () => Promise<void>;
}

export const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
  isOpen,
  onClose,
  language,
  onNavigateTab,
  onOpenEditAuth,
  onTriggerDemo,
}) => {
  const { user, profile, storeName, logOut } = useAuth();

  if (!isOpen) return null;

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'Electrical / Hardware':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Medical / Pharmacy':
        return <Pill className="w-4 h-4 text-rose-500" />;
      case 'Apparel / Garments':
        return <Shirt className="w-4 h-4 text-purple-500" />;
      case 'General Store':
        return <Layers className="w-4 h-4 text-sky-500" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
  };

  const initial = (profile?.shopkeeperName?.[0] || storeName?.[0] || 'द').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#1E293B] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 border-2 border-white/80 shadow-md flex items-center justify-center text-slate-950 font-black text-2xl select-none flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  {getCategoryIcon(profile?.storeCategory)}
                  <span>{profile?.storeCategory?.split('/')[0].trim() || (language === 'hi' ? 'किराना' : 'Kirana')}</span>
                </span>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                    <Cloud className="w-2.5 h-2.5" />
                    Firebase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-black">
                    <WifiOff className="w-2.5 h-2.5" />
                    Offline
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-white truncate mt-1">
                {storeName}
              </h3>
              <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="truncate">
                  {profile?.shopkeeperName || (language === 'hi' ? 'दुकानदार / मालिक' : 'Shopkeeper')}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Complete Shopkeeper Details Card */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section: Shopkeeper Profile Info */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-4 space-y-3">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'hi' ? 'दुकानदार व स्टोर विवरण' : 'Shopkeeper & Store Details'}</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenEditAuth();
                }}
                className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 text-[11px] hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>{language === 'hi' ? 'बदलें' : 'Edit'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Owner */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'दुकानदार का नाम' : 'Shopkeeper Name'}
                  </div>
                  <div className="font-extrabold text-slate-800">
                    {profile?.shopkeeperName || 'रमेश शर्मा'}
                  </div>
                </div>
              </div>

              {/* Store Name */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100">
                <Store className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'दुकान का नाम' : 'Store Name'}
                  </div>
                  <div className="font-extrabold text-slate-800 truncate">
                    {storeName}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100 sm:col-span-2">
                <div className="mt-0.5 flex-shrink-0">
                  {getCategoryIcon(profile?.storeCategory)}
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'व्यापार का प्रकार (Category)' : 'Business Type'}
                  </div>
                  <div className="font-extrabold text-slate-800">
                    {profile?.storeCategory || 'Kirana / Grocery (किराना / ग्रोसरी)'}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100">
                <Phone className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
                  </div>
                  <div className="font-extrabold text-slate-800 font-mono">
                    +91 {profile?.phone || '9876543210'}
                  </div>
                </div>
              </div>

              {/* Location & Pincode */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100">
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'पिनकोड व क्षेत्र' : 'Area & Pincode'}
                  </div>
                  <div className="font-extrabold text-slate-800 truncate">
                    {profile?.pincode ? `पिन: ${profile.pincode}` : 'पिन: 226001'}
                  </div>
                </div>
              </div>

              {/* Address Full */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'दुकान का पूरा पता' : 'Store Address'}
                  </div>
                  <div className="font-semibold text-slate-700 text-xs">
                    {profile?.storeAddress || 'मेन मार्केट, चौक चौराहा, लखनऊ'}
                  </div>
                </div>
              </div>

              {/* GSTIN (if present) */}
              {profile?.gstin && (
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100 sm:col-span-2">
                  <FileText className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">GSTIN</div>
                    <div className="font-mono font-black text-slate-800">
                      {profile.gstin}
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-stone-100 sm:col-span-2">
                <Mail className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-bold">
                    {language === 'hi' ? 'ईमेल' : 'Email'}
                  </div>
                  <div className="font-semibold text-slate-700 truncate">
                    {user?.email || profile?.email || 'sharma.kirana@dukandost.in'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="space-y-2">
            {/* 1-Click Demo Reload */}
            <button
              onClick={async () => {
                await onTriggerDemo();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>
                  {language === 'hi'
                    ? '⚡ 1-क्लिक डेमो किराना रीलोड'
                    : '⚡ 1-Click Demo Kirana Reload'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </button>

            {/* Go to full Profile tab */}
            <button
              onClick={() => {
                onClose();
                onNavigateTab('profile');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-extrabold text-xs flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-600" />
                <span>
                  {language === 'hi' ? 'पूरी दुकान सेटिंग व बैकअप' : 'Full Store Settings & Backup'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Edit / Switch Account */}
            <button
              onClick={() => {
                onClose();
                onOpenEditAuth();
              }}
              className="w-full py-3 px-4 rounded-2xl border border-stone-200 hover:bg-stone-50 text-slate-700 font-extrabold text-xs flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>
                  {language === 'hi'
                    ? 'खाता बदलें या नया स्टोर जोड़ें'
                    : 'Switch Account or Setup Store'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Sign Out */}
            <button
              onClick={async () => {
                await logOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-2xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'खाता लॉग आउट करें (Sign Out)' : 'Sign Out'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'hi'
                ? 'स्थानीय IndexedDB में 100% सुरक्षित'
                : '100% Secure Local IndexedDB'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
