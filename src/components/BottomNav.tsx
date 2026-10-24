import React from 'react';
import { Home, Package, Gift, Users, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavTab = 'home' | 'product' | 'bonus' | 'team' | 'mine';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeOrdersCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  activeOrdersCount = 0,
}) => {
  const { colorConfig } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-[#0b1626]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-2 py-1.5 shadow-lg transition-colors duration-200">
      <div className="grid grid-cols-5 items-center">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center py-1 transition group"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center ${
              currentTab === 'home'
                ? `${colorConfig.bgLightAccent} ${colorConfig.textAccent}`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'home'
                ? `${colorConfig.textAccent} font-black`
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Product */}
        <button
          onClick={() => onTabChange('product')}
          className="flex flex-col items-center justify-center py-1 transition group"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center ${
              currentTab === 'product'
                ? `${colorConfig.bgLightAccent} ${colorConfig.textAccent}`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'product'
                ? `${colorConfig.textAccent} font-black`
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Product
          </span>
        </button>

        {/* 3. Bonus */}
        <button
          onClick={() => onTabChange('bonus')}
          className="flex flex-col items-center justify-center py-1 transition group relative"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center relative ${
              currentTab === 'bonus'
                ? `${colorConfig.bgLightAccent} ${colorConfig.textAccent}`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Gift className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'bonus'
                ? `${colorConfig.textAccent} font-black`
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Bonus
          </span>
        </button>

        {/* 4. Team */}
        <button
          onClick={() => onTabChange('team')}
          className="flex flex-col items-center justify-center py-1 transition group"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center ${
              currentTab === 'team'
                ? `${colorConfig.bgLightAccent} ${colorConfig.textAccent}`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'team'
                ? `${colorConfig.textAccent} font-black`
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Team
          </span>
        </button>

        {/* 5. Mine */}
        <button
          onClick={() => onTabChange('mine')}
          className="flex flex-col items-center justify-center py-1 transition group relative"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center relative ${
              currentTab === 'mine'
                ? `${colorConfig.bgLightAccent} ${colorConfig.textAccent}`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 right-2 px-1 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'mine'
                ? `${colorConfig.textAccent} font-black`
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Mine
          </span>
        </button>
      </div>
    </nav>
  );
};
