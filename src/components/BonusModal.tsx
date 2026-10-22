import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Gift, CheckCircle2, Sparkles, Award, RotateCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHEEL_PRIZES = [500, 1000, 1500, 2500, 5000, 10000];

export const BonusModal: React.FC<BonusModalProps> = ({ isOpen, onClose }) => {
  const { bonusClaims, claimDailyCheckinBonus, claimWheelBonus } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isCheckedInToday = bonusClaims.some(
    (b) => b.claimType === 'daily_checkin' && b.claimDate === todayStr
  );
  const hasSpunToday = bonusClaims.some(
    (b) => b.claimType === 'wheel_spin' && b.claimDate === todayStr
  );

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

  const handleSpinWheel = async () => {
    if (spinning || hasSpunToday) return;

    setSpinning(true);
    setFeedback(null);

    // Pick random prize
    const randomIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = WHEEL_PRIZES[randomIndex];

    // Calculate rotation: 5 full spins (1800 deg) + sector offset
    const sectorAngle = 360 / WHEEL_PRIZES.length;
    const targetRotation = wheelRotation + 1800 + randomIndex * sectorAngle + 15;
    setWheelRotation(targetRotation);

    setTimeout(async () => {
      try {
        const res = await claimWheelBonus(prize);
        if (res.success) {
          setFeedback({ type: 'success', text: `Congratulations! ${res.message}` });
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } else {
          setFeedback({ type: 'error', text: res.message });
        }
      } catch {
        setFeedback({ type: 'error', text: 'Failed to record spin reward' });
      } finally {
        setSpinning(false);
      }
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Bonus Task Center</h3>
              <p className="text-[11px] text-rose-100 font-medium">Free Daily Cash & Rewards</p>
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
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Daily Attendance Check-in</h4>
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

          {/* 2. Lucky Prize Wheel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Royco Daily Lucky Wheel</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Spin once daily to win up to <span className="font-bold text-rose-600">UGX 10,000</span> cash
            </p>

            {/* Wheel graphic */}
            <div className="relative w-44 h-44 mx-auto my-2 flex items-center justify-center">
              <div
                className="w-full h-full rounded-full border-4 border-amber-400 shadow-lg relative overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transitionDuration: spinning ? '3s' : '0s',
                  background:
                    'conic-gradient(#ff7675 0deg 60deg, #fdcb6e 60deg 120deg, #55efc4 120deg 180deg, #74b9ff 180deg 240deg, #a29bfe 240deg 300deg, #fd79a8 300deg 360deg)',
                }}
              >
                {/* Labels on sectors */}
                <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-white drop-shadow-xs">
                  500
                </span>
                <span className="absolute top-1/4 right-3 text-[9px] font-black text-slate-900 drop-shadow-xs">
                  1K
                </span>
                <span className="absolute bottom-1/4 right-3 text-[9px] font-black text-slate-900 drop-shadow-xs">
                  1.5K
                </span>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black text-white drop-shadow-xs">
                  2.5K
                </span>
                <span className="absolute bottom-1/4 left-3 text-[9px] font-black text-white drop-shadow-xs">
                  5K
                </span>
                <span className="absolute top-1/4 left-3 text-[9px] font-black text-white drop-shadow-xs">
                  10K
                </span>
              </div>

              {/* Center Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-5 bg-rose-600 clip-triangle shadow-sm z-10" />

              {/* Center Pin */}
              <div className="absolute w-10 h-10 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center text-xs font-black text-rose-600">
                WIN
              </div>
            </div>

            <button
              onClick={handleSpinWheel}
              disabled={spinning || hasSpunToday}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                hasSpunToday
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25 hover:brightness-105'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{hasSpunToday ? 'Come Back Tomorrow For Next Spin' : spinning ? 'Spinning Wheel...' : 'Spin The Wheel Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
