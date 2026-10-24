import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Plus, LogIn, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onDepositClick: () => void;
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDepositClick, onAuthClick }) => {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme, colorConfig } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1626]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/aistudio/file_00000000784c81f4b55dedd74b2223f9_6a04b5cc.png"
            alt="Royco Mix Investment"
            className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0 border border-amber-400/30"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                ROYCO MIX
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30">
                UGX
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline" /> Official Portal
            </p>
          </div>
        </div>

        {/* Right: Theme Switcher, Wallet Balance & User Auth status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-90"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onDepositClick}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl transition text-left active:scale-95"
              >
                <div>
                  <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Balance
                  </div>
                  <div className={`text-xs font-black ${colorConfig.textAccent}`}>
                    UGX {(profile?.balanceUGX ?? 0).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full ${colorConfig.buttonPrimary} flex items-center justify-center ml-1 shrink-0 text-xs shadow-xs`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>

              <button
                onClick={() => signOut()}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-500 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${colorConfig.buttonPrimary} rounded-xl text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition`}
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
