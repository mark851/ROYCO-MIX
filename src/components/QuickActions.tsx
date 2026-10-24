import React from 'react';
import { Wallet, Landmark, MessageSquareText, ClipboardList, Gift } from 'lucide-react';

interface QuickActionsProps {
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onOnlineClick: () => void;
  onOrderClick: () => void;
  onBonusClick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onDepositClick,
  onWithdrawClick,
  onOnlineClick,
  onOrderClick,
  onBonusClick,
}) => {
  return (
    <div className="grid grid-cols-5 gap-2 px-3 py-3 bg-white dark:bg-[#0b1626] border-b border-slate-100 dark:border-slate-800/80 transition-colors">
      {/* 1. Deposit */}
      <button
        onClick={onDepositClick}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/20 flex items-center justify-center text-white mb-1.5 group-hover:scale-105 transition-transform">
          <Wallet className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Deposit</span>
      </button>

      {/* 2. Withdraw */}
      <button
        onClick={onWithdrawClick}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 flex items-center justify-center text-white mb-1.5 group-hover:scale-105 transition-transform">
          <Landmark className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Withdraw</span>
      </button>

      {/* 3. Online */}
      <button
        onClick={onOnlineClick}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 group relative"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-md shadow-cyan-500/20 flex items-center justify-center text-white mb-1.5 group-hover:scale-105 transition-transform relative">
          <MessageSquareText className="w-6 h-6 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-rose-500 text-[8px] font-bold text-white rounded-full uppercase leading-tight">
            Live
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Online</span>
      </button>

      {/* 4. Order */}
      <button
        onClick={onOrderClick}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-orange-500/20 flex items-center justify-center text-white mb-1.5 group-hover:scale-105 transition-transform">
          <ClipboardList className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Order</span>
      </button>

      {/* 5. Gift Bonus */}
      <button
        onClick={onBonusClick}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/20 flex items-center justify-center text-white mb-1.5 group-hover:scale-105 transition-transform">
          <Gift className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight">Gift Bonus</span>
      </button>
    </div>
  );
};

