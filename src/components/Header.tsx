import React from 'react';
import { Store, Globe, Search, WifiOff, Home, LayoutGrid, BarChart2, User, Cloud, CloudCheck, Lock, Mic } from 'lucide-react';
import { NavigationTab } from './Navigation';
import { useAuth } from '@/features/auth';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: 'hi' | 'en';
  onLanguageToggle?: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  isSyncing?: boolean;
  onOpenVoice?: () => void;
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
}) => {
  const { user, storeName } = useAuth();

  const todayDateStr = language === 'hi' 
    ? new Intl.DateTimeFormat('hi-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())
    : new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());

  const navLinks = [
    { id: 'home' as NavigationTab, label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'inventory' as NavigationTab, label: language === 'hi' ? 'स्टॉक सूची' : 'Inventory', icon: LayoutGrid },
    { id: 'reports' as NavigationTab, label: language === 'hi' ? 'रीऑर्डर रिपोर्ट' : 'Reorder Reports', icon: BarChart2 },
    { id: 'profile' as NavigationTab, label: language === 'hi' ? 'दुकान सेटिंग' : 'Store Profile', icon: User },
  ];

  return (
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
                  {language === 'hi' ? 'मेरी दुकान' : 'Meri Dukaan'}
                </span>
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
                {storeName} • {todayDateStr}
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Assistant Mic Button */}
          {onOpenVoice && (
            <button
              onClick={onOpenVoice}
              className="h-10 px-3 rounded-2xl border border-violet-200 bg-violet-50 hover:bg-violet-100 flex items-center gap-1.5 text-xs font-black text-violet-800 shadow-2xs transition-all active:scale-95"
              title={language === 'hi' ? 'वॉइस असिस्टेंट (बोलकर आदेश दें)' : 'Voice Assistant'}
            >
              <Mic className="w-4 h-4 text-violet-600 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {language === 'hi' ? 'बोलें' : 'Voice'}
              </span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="h-10 px-3 sm:px-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-2xs transition-all active:scale-95"
            title="Search Inventory"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'सामान खोजें...' : 'Search items...'}
            </span>
          </button>

          {/* Auth Button */}
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
                <span className="hidden sm:inline max-w-[90px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'hi' ? 'लॉगिन' : 'Login'}</span>
              </>
            )}
          </button>

          {/* Language Switch */}
          <button
            onClick={onLanguageToggle}
            className="h-10 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5 text-xs font-black text-slate-800 shadow-2xs transition-all active:scale-95"
            title="Switch Language (भाषा बदलें)"
          >
            <Globe className="w-4 h-4 text-violet-600" />
            <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>

          {/* User Avatar */}
          <button
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-2 pl-1 active:scale-95 transition-transform"
            title="Store Profile"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border-2 border-white shadow-sm flex items-center justify-center text-lg select-none">
              👨🏽‍💼
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
