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



  // Dashboard + Inventory + Hustle AI + Reports in desktop navbar
  const navLinks = [
    { id: 'home' as NavigationTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'inventory' as NavigationTab, label: language === 'hi' ? 'इन्वेंट्री' : 'Inventory', icon: LayoutGrid },
    { id: 'hustle' as NavigationTab, label: language === 'hi' ? '⚡ बिल व AI' : '⚡ Hustle AI', icon: Sparkles },
    { id: 'reports' as NavigationTab, label: language === 'hi' ? 'रिपोर्ट्स' : 'Reports', icon: BarChart2 },
  ];

  const initial = (profile?.shopkeeperName?.[0] || storeName?.[0] || 'द').toUpperCase();

  return (
    <>
      {/* Sleek, Modern Deep Slate Glass Header */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">

          {/* ── Brand & Store Identity (flex-none so it never squishes) ── */}
          <div className="flex-none flex items-center gap-3">
            <button
              onClick={() => onTabChange('home')}
              className="flex items-center gap-3 text-left group"
            >
              {/* Refined Amber Gold Store Icon */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all flex-shrink-0 border border-amber-300/40">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 stroke-[2.5]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-white tracking-tight whitespace-nowrap">
                    {language === 'hi' ? 'दुकान दोस्त' : 'Dukan Dost'}
                  </span>
                  {/* Kirana / category badge */}
                  <span className="inline-flex flex-shrink-0 items-center px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    {profile?.storeCategory
                      ? profile.storeCategory.split('/')[0].trim()
                      : (language === 'hi' ? 'किराना' : 'Kirana')}
                  </span>
                  {user ? (
                    <span className="hidden lg:inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold">
                      <Cloud className="w-2.5 h-2.5" />
                      Synced
                    </span>
                  ) : (
                    <span className="hidden lg:inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-slate-400 text-[10px] font-semibold">
                      <WifiOff className="w-2.5 h-2.5" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* ── Center Nav Tabs (Properly Fitted & Segmented) ── */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.05] p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
            {navLinks.map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08] active:scale-98'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950 stroke-[2.8]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right Action Tools ── */}
          <div className="flex-none flex items-center gap-2 sm:gap-2.5">

            {/* Voice Assistant */}
            {onOpenVoice && (
              <button
                onClick={onOpenVoice}
                className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white flex items-center gap-1.5 text-xs font-black shadow-sm border border-violet-400/30 transition-all active:scale-95"
                title={language === 'hi' ? 'वॉइस असिस्टेंट' : 'Voice Assistant'}
              >
                <Mic className="w-4 h-4 text-violet-200 stroke-[2.5]" />
                <span className="hidden lg:inline whitespace-nowrap">
                  {language === 'hi' ? 'बोलें' : 'Voice'}
                </span>
              </button>
            )}

            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center gap-2 font-bold border border-white/[0.08] transition-all active:scale-95"
              title={language === 'hi' ? 'खोजें' : 'Search Inventory'}
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-xs whitespace-nowrap">
                {language === 'hi' ? 'खोजें...' : 'Search...'}
              </span>
            </button>

            {/* Language Switch */}
            <button
              onClick={onLanguageToggle}
              className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center gap-1.5 font-black border border-white/[0.08] text-xs transition-all active:scale-95"
              title="Switch Language (भाषा बदलें)"
            >
              <Globe className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {language === 'hi' ? 'EN' : 'हिन्दी'}
              </span>
            </button>

            {/* Shopkeeper Profile Avatar */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/40 active:scale-95 transition-all group"
              title={language === 'hi' ? 'प्रोफ़ाइल देखें' : 'View Profile'}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-sm select-none group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B0F19]" />
              </div>
              <div className="hidden lg:block text-left pr-1 min-w-0">
                <div className="text-xs font-black text-white leading-tight truncate max-w-[100px]">
                  {profile?.shopkeeperName || storeName}
                </div>
                <div className="text-[10px] font-bold text-slate-400 leading-tight flex items-center gap-0.5">
                  <span className="truncate max-w-[80px]">
                    {profile?.storeCategory ? profile.storeCategory.split('/')[0].trim() : (language === 'hi' ? 'दुकानदार' : 'Owner')}
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
