import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, Sparkles, Smartphone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signUpWithPhone, signInWithPhone } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invitationCode, setInvitationCode] = useState(() => {
    try {
      return localStorage.getItem('royco_referred_by') || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      try {
        const storedRef = localStorage.getItem('royco_referred_by');
        if (storedRef && !invitationCode) {
          setInvitationCode(storedRef);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithPhone(phone, password, invitationCode);
        if (res.success) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = await signInWithPhone(phone, password);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1764c4] via-[#1d70d6] to-[#1452a0] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/file_00000000784c81f4b55dedd74b2223f9_6a04b5cc.png"
              alt="Royco Mix"
              className="w-9 h-9 rounded-xl object-cover border border-amber-300/40 shadow-sm shrink-0"
            />
            <div>
              <h3 className="font-extrabold text-base leading-tight">ROYCO MIX</h3>
              <p className="text-[11px] text-blue-100">
                {mode === 'signup' ? 'New Member Account Registration' : 'Investor Account Sign In'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign Up vs Sign In */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-black text-center transition border-b-2 ${
              mode === 'signup'
                ? 'border-[#1764c4] text-[#1764c4] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account (UGX 3,000 Bonus)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-black text-center transition border-b-2 ${
              mode === 'signin'
                ? 'border-[#1764c4] text-[#1764c4] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In With Password
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Welcome Bonus Notice for Sign Up */}
          {mode === 'signup' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-black text-amber-950 block">UGX 3,000 Trial Capital</span>
                <span className="text-amber-800 text-[11px]">
                  All new accounts receive UGX 3,000 free bonus trial balance upon join!
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Phone Number Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number (MTN / Airtel):
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0771234567 or 25677..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Invitation Code (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Invitation Code:
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="Optional invitation code"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !phone || !password}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1764c4] to-[#1e76e0] text-white font-black text-xs shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'signup' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Register & Receive UGX 3,000 Bonus</span>
                </>
              ) : (
                <span>Sign In To My Account</span>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" /> Secure Number & Password Login
          </p>
        </div>
      </div>
    </div>
  );
};
