import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Plus, Sparkles, LogIn, LogOut } from 'lucide-react';

interface HeaderProps {
  onDepositClick: () => void;
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDepositClick, onAuthClick }) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1764c4] via-[#1d70d6] to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg tracking-wider">
            RM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1">
                ROYCO MIX
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80">
                UGX
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" /> Official Investment Portal
            </p>
          </div>
        </div>

        {/* Right: Wallet Balance & User Auth status */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDepositClick}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#eef5fa] hover:bg-[#e0eef8] border border-[#bcd7ec] rounded-xl transition text-left active:scale-95"
              >
                <div>
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    Balance
                  </div>
                  <div className="text-xs font-black text-[#1764c4]">
                    UGX {(profile?.balanceUGX ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1764c4] text-white flex items-center justify-center ml-1 shrink-0">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>

              <button
                onClick={() => signOut()}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1764c4] to-[#1d70d6] text-white rounded-xl text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
