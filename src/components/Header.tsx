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
  CloudCheck,
  Lock,
  Mic,
  Sparkles,
  ChevronDown,
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
  onOpenAuth,
  isSyncing = false,
  onOpenVoice,
  onSeedSampleData,
}) => {
  const { user, storeName, profile, demoLogin } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const todayDateStr = language === 'hi' 
    ? new Intl.DateTimeFormat('hi-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())
    : new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());

  // Note: 'profile' tab removed from navbar as requested; accessed via Profile Avatar Icon
  const navLinks = [
    { id: 'home' as NavigationTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'inventory' as NavigationTab, label: language === 'hi' ? 'स्टॉक सूची' : 'Inventory', icon: LayoutGrid },
    { id: 'reports' as NavigationTab, label: language === 'hi' ? 'रीऑर्डर रिपोर्ट' : 'Reorder Reports', icon: BarChart2 },
  ];

  const handleDemoLoginClick = async () => {
    setIsDemoLoading(true);
    try {
      await demoLogin();
      if (onSeedSampleData) {
        await onSeedSampleData();
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  const initial = (profile?.shopkeeperName?.[0] || storeName?.[0] || 'द').toUpperCase();

  return (
    <>
      {/* Extended, Pop-Coloured Navbar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#2E1065] border-b-2 border-fuchsia-500/30 shadow-xl shadow-indigo-950/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4">
          {/* Brand & Store Identity */}
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => onTabChange('home')}
              className="flex items-center gap-3 text-left group"
            >
              {/* Vibrant Pop 3D Store Icon */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 group-hover:rotate-2 transition-all flex-shrink-0 border-2 border-amber-300/80">
                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 stroke-[2.5]" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs">
                    {language === 'hi' ? 'दुकान दोस्त' : 'Dukan Dost'}
                  </span>
                  {profile?.storeCategory && (
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {profile.storeCategory.split('/')[0].trim()}
                    </span>
                  )}
                  {user ? (
                    <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-black">
                      <Cloud className="w-2.5 h-2.5" />
                      Firebase Sync
                    </span>
                  ) : (
                    <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-slate-200 text-[10px] font-black">
                      <WifiOff className="w-2.5 h-2.5" />
                      100% Offline
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-amber-200/90 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                  <span className="text-white font-extrabold">{storeName}</span>
                  {profile?.shopkeeperName ? ` • ${profile.shopkeeperName}` : ''} • {todayDateStr}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Web Navigation Tabs (Without Store Profile Tab) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {navLinks.map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40 ring-1 ring-white/30 scale-102'
                      : 'text-slate-200 hover:text-white hover:bg-white/10 active:scale-98'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-amber-300 stroke-[2.8]' : 'text-slate-300'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools with Vibrant Pop Colours */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* ⚡ Glowing Pop Demo Login Button */}
            <button
              onClick={handleDemoLoginClick}
              disabled={isDemoLoading}
              className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 border-2 border-amber-300 flex items-center gap-1.5 active:scale-95 transition-all"
              title={language === 'hi' ? '1-क्लिक डेमो किराना लॉगिन (शर्मा किराना स्टोर)' : '1-Click Demo Kirana Store Login'}
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-bounce" />
              <span className="hidden sm:inline">
                {language === 'hi' ? '⚡ डेमो लॉगिन' : '⚡ Demo Login'}
              </span>
              <span className="sm:hidden font-black">Demo</span>
            </button>

            {/* Voice Assistant Mic Button with Electric Fuchsia Pop */}
            {onOpenVoice && (
              <button
                onClick={onOpenVoice}
                className="h-11 sm:h-12 px-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:opacity-90 text-white flex items-center gap-1.5 text-xs sm:text-sm font-black shadow-md shadow-pink-500/30 border border-pink-400/40 transition-all active:scale-95"
                title={language === 'hi' ? 'वॉइस असिस्टेंट (बोलकर आदेश दें)' : 'Voice Assistant'}
              >
                <Mic className="w-4 h-4 text-white stroke-[2.5]" />
                <span className="hidden lg:inline">
                  {language === 'hi' ? 'बोलें' : 'Voice'}
                </span>
              </button>
            )}

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="h-11 sm:h-12 px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 text-xs sm:text-sm font-bold border border-white/15 backdrop-blur-xs shadow-sm transition-all active:scale-95"
              title="Search Inventory"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span className="hidden xl:inline">
                {language === 'hi' ? 'खोजें...' : 'Search...'}
              </span>
            </button>

            {/* Login / Auth Button with Emerald Pop */}
            <button
              onClick={onOpenAuth}
              className={`h-11 sm:h-12 px-3.5 rounded-2xl flex items-center gap-1.5 text-xs sm:text-sm font-black transition-all active:scale-95 border ${
                user
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-emerald-400/40 shadow-md shadow-emerald-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title={user ? user.email || 'Account' : 'Login / Sign Up'}
            >
              {user ? (
                <>
                  <CloudCheck className={`w-4 h-4 text-white ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span className="hidden md:inline max-w-[80px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'लॉगिन' : 'Login'}</span>
                </>
              )}
            </button>

            {/* Language Switch */}
            <button
              onClick={onLanguageToggle}
              className="h-11 sm:h-12 px-3 sm:px-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs font-extrabold border border-white/15 shadow-sm transition-all active:scale-95"
              title="Switch Language (भाषा बदलें)"
            >
              <Globe className="w-4 h-4 text-cyan-300" />
              <span className="text-[11px] font-black">{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Proper Interactive Shopkeeper Profile Avatar Icon */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-white/15 border border-white/15 hover:border-amber-300/50 active:scale-95 transition-all group"
              title={language === 'hi' ? 'दुकानदार प्रोफ़ाइल विवरण देखें (View All Details)' : 'View Shopkeeper Profile Details'}
            >
              <div className="relative">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 text-slate-950 border-2 border-amber-300 shadow-md shadow-amber-500/25 flex items-center justify-center font-black text-base select-none group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-2xs animate-pulse" />
              </div>
              <div className="hidden lg:block text-left pr-1">
                <div className="text-xs font-black text-white leading-tight truncate max-w-[105px]">
                  {profile?.shopkeeperName || storeName}
                </div>
                <div className="text-[10px] font-extrabold text-amber-300 leading-tight flex items-center gap-0.5">
                  <span>{profile?.storeCategory ? profile.storeCategory.split('/')[0].trim() : (language === 'hi' ? 'दुकानदार' : 'Owner')}</span>
                  <ChevronDown className="w-3 h-3 text-amber-300" />
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
        onTriggerDemo={handleDemoLoginClick}
      />
    </>
  );
};
