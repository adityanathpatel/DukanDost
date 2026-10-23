import React, { useState } from 'react';
import {
  Store,
  Globe,
  Search,
  WifiOff,
  Home,
  LayoutGrid,
  BarChart2,
  Cloud,
  Mic,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from './Navigation';
import { useAuth } from '@/features/auth';
import { ProfileDetailsModal } from './ProfileDetailsModal';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: 'hi' | 'en';
  onLanguageToggle?: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  isSyncing?: boolean;
  onOpenVoice?: () => void;
  onSeedSampleData?: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageToggle,
  onOpenSearch,
  onOpenVoice,
  onOpenAuth,
}) => {
  const { user, storeName, profile } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Dynamic bilingual category label
  const getCategoryLabel = (category?: string, lang: 'hi' | 'en' = 'hi') => {
    if (!category || category.includes('Kirana') || category.includes('किराना') || category.includes('Grocery')) {
      return lang === 'hi' ? 'किराना' : 'Kirana';
    }
    if (category.includes('Electrical') || category.includes('Hardware') || category.includes('इलेक्ट्रिकल')) {
      return lang === 'hi' ? 'इलेक्ट्रिकल' : 'Hardware';
    }
    if (category.includes('Medical') || category.includes('Pharmacy') || category.includes('दवा')) {
      return lang === 'hi' ? 'मेडिकल' : 'Pharmacy';
    }
    if (category.includes('Apparel') || category.includes('Garment') || category.includes('कपड़े')) {
      return lang === 'hi' ? 'कपड़े' : 'Apparel';
    }
    return lang === 'hi' ? 'जनरल स्टोर' : 'General';
  };

  // Default bilingual names when using initial/demo store
  const defaultStoreNameHi = 'शर्मा किराना स्टोर';
  const defaultStoreNameEn = 'Sharma Kirana Store';
  const isDefaultStore = !storeName || storeName === defaultStoreNameHi || storeName === defaultStoreNameEn;
  const displayStoreName = isDefaultStore
    ? (language === 'hi' ? defaultStoreNameHi : defaultStoreNameEn)
    : storeName;

  const defaultOwnerHi = 'रमेश शर्मा';
  const defaultOwnerEn = 'Ramesh Sharma';
  const isDefaultOwner = !profile?.shopkeeperName || profile.shopkeeperName === defaultOwnerHi || profile.shopkeeperName === defaultOwnerEn;
  const displayOwnerName = isDefaultOwner
    ? (language === 'hi' ? defaultOwnerHi : defaultOwnerEn)
    : (profile?.shopkeeperName || displayStoreName);

  // Single-letter avatar initial that adapts properly in Hindi ('श' or 'र') and English ('S' or 'R')
  const initial = (displayOwnerName?.[0] || (language === 'hi' ? 'द' : 'D')).toUpperCase();

  // Segmented navbar destinations (compact, responsive, and bilingual)
  const navLinks = [
    { id: 'home' as NavigationTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'inventory' as NavigationTab, label: language === 'hi' ? 'इन्वेंट्री' : 'Inventory', icon: LayoutGrid },
    { id: 'hustle' as NavigationTab, label: language === 'hi' ? '⚡ बिल व AI' : '⚡ Hustle AI', icon: Sparkles },
    { id: 'reports' as NavigationTab, label: language === 'hi' ? 'रिपोर्ट्स' : 'Reports', icon: BarChart2 },
  ];

  return (
    <>
      {/* Sleek, Modern Deep Slate Glass Header — Always Perfectly Fitted */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-md shadow-black/20 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">

          {/* ── Brand & Store Identity (flex-shrink-0 so it never squishes) ── */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group"
            >
              {/* Amber Gold Brand Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all flex-shrink-0 border border-amber-300/40">
                <Store className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap">
                  {language === 'hi' ? 'दुकान दोस्त' : 'Dukan Dost'}
                </span>

                {/* Bilingual Category Badge (Changes between 'किराना' and 'Kirana') */}
                <span className="inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  {getCategoryLabel(profile?.storeCategory, language)}
                </span>

                {/* Bilingual Sync / Offline Badge */}
                {user ? (
                  <span className="hidden sm:inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>{language === 'hi' ? 'सिंक' : 'Synced'}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-slate-400 text-[10px] font-semibold">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>{language === 'hi' ? 'ऑफलाइन' : 'Offline'}</span>
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* ── Center Nav Tabs (Properly Fitted, Proportional & Fully Bilingual) ── */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl sm:rounded-2xl border border-white/[0.08] shadow-inner">
            {navLinks.map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08] active:scale-98'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-slate-950 stroke-[2.8]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right Action Tools (Fitted & Responsive, Never Overflowing) ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">

            {/* Voice Assistant */}
            {onOpenVoice && (
              <button
                onClick={onOpenVoice}
                className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white flex items-center gap-1.5 text-xs font-black shadow-sm border border-violet-400/30 transition-all active:scale-95"
                title={language === 'hi' ? 'वॉइस असिस्टेंट' : 'Voice Assistant'}
              >
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-200 stroke-[2.5]" />
                <span className="hidden xl:inline whitespace-nowrap">
                  {language === 'hi' ? 'बोलें' : 'Voice'}
                </span>
              </button>
            )}

            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center gap-1.5 font-bold border border-white/[0.08] transition-all active:scale-95"
              title={language === 'hi' ? 'खोजें' : 'Search Inventory'}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden xl:inline text-xs whitespace-nowrap">
                {language === 'hi' ? 'खोजें...' : 'Search...'}
              </span>
            </button>

            {/* Language Switch */}
            <button
              onClick={onLanguageToggle}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center gap-1 font-black border border-white/[0.08] text-xs transition-all active:scale-95"
              title={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
              <span className="whitespace-nowrap font-extrabold">
                {language === 'hi' ? 'EN' : 'हिन्दी'}
              </span>
            </button>

            {/* Shopkeeper Profile Avatar */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/40 active:scale-95 transition-all group"
              title={language === 'hi' ? 'प्रोफ़ाइल देखें' : 'View Profile'}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-sm select-none group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
              </div>
              <div className="hidden lg:block text-left pr-0.5 min-w-0">
                <div className="text-xs font-black text-white leading-tight truncate max-w-[85px] xl:max-w-[110px]">
                  {displayOwnerName}
                </div>
                <div className="text-[10px] font-bold text-slate-400 leading-tight flex items-center gap-0.5">
                  <span className="truncate max-w-[70px]">
                    {language === 'hi' ? 'दुकानदार' : 'Owner'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </div>
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Comprehensive Profile Details Modal */}
      <ProfileDetailsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        language={language}
        onNavigateTab={(tab) => {
          onTabChange(tab);
          setIsProfileModalOpen(false);
        }}
        onOpenEditAuth={() => {
          if (onOpenAuth) onOpenAuth();
          setIsProfileModalOpen(false);
        }}
        onTriggerDemo={async () => {}}
      />
    </>
  );
};
