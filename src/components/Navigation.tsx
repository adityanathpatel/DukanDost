import React from 'react';
import { Home, LayoutGrid, BarChart2, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export type NavigationTab = 'home' | 'inventory' | 'reports' | 'hustle' | 'profile';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: 'hi' | 'en';
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  language: _language,
}) => {
  const tabs = [
    {
      id: 'home' as NavigationTab,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'inventory' as NavigationTab,
      label: 'Inventory',
      icon: LayoutGrid, // 4-grid squares icon matching reference
    },
    {
      id: 'hustle' as NavigationTab,
      label: 'Hustle AI',
      icon: Sparkles, // Hustle AI billing & tools icon
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Reports',
      icon: BarChart2, // 3-bar analytics icon matching reference
    },
    {
      id: 'profile' as NavigationTab,
      label: 'Profile',
      icon: User, // Minimal user icon matching reference
    },
  ];

  return (
    <nav 
      aria-label="Bottom Navigation"
      className="fixed bottom-6 left-0 right-0 max-w-[420px] mx-auto px-4 z-40"
    >
      <div className="bg-[#0B0F19] text-white rounded-[32px] px-3 py-2 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'transition-all duration-200 flex items-center justify-center',
                isActive
                  ? 'w-13 h-12 px-4 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105'
                  : 'w-11 h-11 rounded-full text-slate-400 hover:text-white active:scale-95'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={clsx(
                  'w-5 h-5 transition-transform',
                  isActive ? 'text-slate-950 stroke-[2.8]' : 'text-slate-400 stroke-[2]'
                )} 
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
