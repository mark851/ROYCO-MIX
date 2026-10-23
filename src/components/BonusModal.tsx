import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Gift,
  CheckCircle2,
  Sparkles,
  Award,
  AlertCircle,
  Ticket,
  ArrowRight,
  History,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BonusModal: React.FC<BonusModalProps> = ({ isOpen, onClose }) => {
  const { bonusClaims, claimDailyCheckinBonus, redeemGiftCode, profile } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isCheckedInToday = bonusClaims.some(
    (b) => b.claimType === 'daily_checkin' && b.claimDate === todayStr
  );

  // Past redeemed gift vouchers
  const redeemedVouchers = bonusClaims.filter((b) => b.claimType === 'gift_code');

  const handleCheckin = async () => {
    setCheckingIn(true);
    setFeedback(null);
    try {
      const res = await claimDailyCheckinBonus();
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error claiming daily check-in bonus' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = giftCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setFeedback({ type: 'error', text: 'Please enter a valid gift code.' });
      return;
    }

    setRedeeming(true);
    setFeedback(null);
    try {
      const res = await redeemGiftCode(cleanCode);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setGiftCodeInput('');
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.6 },
        });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to process gift code redemption.' });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Bonus & Rewards</h3>
              <p className="text-[11px] text-rose-100 font-medium">Daily Attendance & Gift Codes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* 1. Daily Check-in Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Daily Attendance Bonus</h4>
                  <p className="text-[11px] text-amber-900">Receive UGX 1,000 every single day</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckin}
              disabled={isCheckedInToday || checkingIn}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs ${
                isCheckedInToday
                  ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed border border-emerald-200'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-105 shadow-amber-500/20'
              }`}
            >
              {isCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Checked In Today (+UGX 1,000 Credited)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{checkingIn ? 'Claiming...' : 'Sign In Today & Claim UGX 1,000'}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Gift Code Redemption Section (Replaced Wheel) */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 space-y-3.5 border border-indigo-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Redeem Gift Code</h4>
                  <p className="text-[11px] text-indigo-200">Instant cash rewards to your balance</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Official Voucher
              </span>
            </div>

            <form onSubmit={handleRedeemGift} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Enter Gift / Voucher Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={giftCodeInput}
                    onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ROYCO2026"
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-800/90 border border-indigo-400/40 rounded-xl text-white font-mono font-black text-sm tracking-widest placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                  />
                  {giftCodeInput && (
                    <button
                      type="button"
                      onClick={() => setGiftCodeInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={redeeming || !giftCodeInput.trim()}
                className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
                  !giftCodeInput.trim() || redeeming
                    ? 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:brightness-110 text-white shadow-pink-500/25'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{redeeming ? 'Verifying Code...' : 'Redeem Gift Cash Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>How to get Gift Codes?</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Gift codes are released by the Royco Mix Administrator during special events, Telegram giveaways, and WhatsApp updates. Check with your community manager or admin panel.
              </p>
            </div>
          </div>

          {/* 3. History of Redeemed Gift Codes */}
          {redeemedVouchers.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Redeemed Vouchers</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {redeemedVouchers.length} redeemed
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {redeemedVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-800">
                        {voucher.code || 'GIFT-CODE'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {voucher.claimDate}
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                      +UGX {voucher.rewardUGX.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
