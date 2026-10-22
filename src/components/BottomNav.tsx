import React from 'react';
import { Home, Package, Gift, Users, User } from 'lucide-react';

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
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 px-2 py-1.5 shadow-lg">
      <div className="grid grid-cols-5 items-center">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center py-1 transition group"
        >
          <div
            className={`px-4 py-1 rounded-full transition-colors flex items-center justify-center ${
              currentTab === 'home'
                ? 'bg-[#d8e8f8] text-[#1764c4]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'home' ? 'text-[#1764c4] font-bold' : 'text-slate-500'
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
                ? 'bg-[#d8e8f8] text-[#1764c4]'
                : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'product' ? 'text-[#1764c4] font-bold' : 'text-slate-500'
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
                ? 'bg-[#d8e8f8] text-[#1764c4]'
                : 'text-rose-500 hover:text-rose-600'
            }`}
          >
            <Gift className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'bonus' ? 'text-[#1764c4] font-bold' : 'text-slate-500'
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
                ? 'bg-[#d8e8f8] text-[#1764c4]'
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              currentTab === 'team' ? 'text-[#1764c4] font-bold' : 'text-slate-500'
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
                ? 'bg-[#d8e8f8] text-[#1764c4]'
                : 'text-amber-800 hover:text-amber-900'
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
              currentTab === 'mine' ? 'text-[#1764c4] font-bold' : 'text-slate-500'
            }`}
          >
            Mine
          </span>
        </button>
      </div>
    </nav>
  );
};
