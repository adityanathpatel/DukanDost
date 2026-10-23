import React, { useState } from 'react';
import {
  Store,
  Globe,
  Search,
  WifiOff,
  Home,
  LayoutGrid,
  BarChart2,
  User,
  Cloud,
  CloudCheck,
  Lock,
  Mic,
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

  const navLinks = [
    { id: 'home' as NavigationTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'inventory' as NavigationTab, label: language === 'hi' ? 'स्टॉक सूची' : 'Inventory', icon: LayoutGrid },
    { id: 'reports' as NavigationTab, label: language === 'hi' ? 'रीऑर्डर रिपोर्ट' : 'Reorder Reports', icon: BarChart2 },
    { id: 'profile' as NavigationTab, label: language === 'hi' ? 'दुकानदार प्रोफ़ाइल' : 'Store Profile', icon: User },
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Store Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-900 tracking-tight">
                    {language === 'hi' ? 'दुकान दोस्त' : 'Dukan Dost'}
                  </span>
                  {profile?.storeCategory && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                      {profile.storeCategory.split('/')[0].trim()}
                    </span>
                  )}
                  {user ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      <Cloud className="w-2.5 h-2.5" />
                      Firebase
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                      <WifiOff className="w-2.5 h-2.5" />
                      100% Offline
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400">
                  {storeName} {profile?.shopkeeperName ? `• ${profile.shopkeeperName}` : ''} • {todayDateStr}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Web Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navLinks.map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600 stroke-[2.5]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* ⚡ Prominent Demo Login Button */}
            <button
              onClick={handleDemoLoginClick}
              disabled={isDemoLoading}
              className="h-10 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-xs border border-amber-400/80 flex items-center gap-1.5 active:scale-95 transition-all"
              title={language === 'hi' ? '1-क्लिक डेमो किराना लॉगिन (शर्मा किराना स्टोर)' : '1-Click Demo Kirana Store Login'}
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">
                {language === 'hi' ? 'डेमो लॉगिन' : 'Demo Login'}
              </span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Voice Assistant Mic Button */}
            {onOpenVoice && (
              <button
                onClick={onOpenVoice}
                className="h-10 px-3 rounded-2xl border border-violet-200 bg-violet-50 hover:bg-violet-100 flex items-center gap-1.5 text-xs font-black text-violet-800 shadow-2xs transition-all active:scale-95"
                title={language === 'hi' ? 'वॉइस असिस्टेंट (बोलकर आदेश दें)' : 'Voice Assistant'}
              >
                <Mic className="w-4 h-4 text-violet-600 stroke-[2.5]" />
                <span className="hidden lg:inline">
                  {language === 'hi' ? 'बोलें' : 'Voice'}
                </span>
              </button>
            )}

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="h-10 px-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-2xs transition-all active:scale-95"
              title="Search Inventory"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline">
                {language === 'hi' ? 'खोजें...' : 'Search...'}
              </span>
            </button>

            {/* Login / Auth Button */}
            <button
              onClick={onOpenAuth}
              className={`h-10 px-3 rounded-2xl border flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 ${
                user
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title={user ? user.email || 'Account' : 'Login / Sign Up'}
            >
              {user ? (
                <>
                  <CloudCheck className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span className="hidden md:inline max-w-[80px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'लॉगिन' : 'Login'}</span>
                </>
              )}
            </button>

            {/* Language Switch */}
            <button
              onClick={onLanguageToggle}
              className="h-10 px-2.5 sm:px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5 text-xs font-black text-slate-800 shadow-2xs transition-all active:scale-95"
              title="Switch Language (भाषा बदलें)"
            >
              <Globe className="w-4 h-4 text-violet-600" />
              <span className="text-[11px]">{language === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* Proper Interactive Shopkeeper Profile Icon */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 active:scale-95 transition-all group"
              title={language === 'hi' ? 'दुकानदार प्रोफ़ाइल विवरण देखें' : 'View Shopkeeper Profile Details'}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-950 font-black text-sm select-none group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
              </div>
              <div className="hidden lg:block text-left pr-1">
                <div className="text-xs font-black text-slate-900 leading-tight truncate max-w-[100px]">
                  {profile?.shopkeeperName || storeName}
                </div>
                <div className="text-[10px] font-bold text-amber-700 leading-tight">
                  {profile?.storeCategory ? profile.storeCategory.split('/')[0].trim() : (language === 'hi' ? 'दुकानदार' : 'Owner')}
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
