import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Wallet,
  Landmark,
  ClipboardList,
  ShieldCheck,
  CreditCard,
  History,
  PhoneCall,
  LogOut,
  ChevronRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface MineViewProps {
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onOrderClick: () => void;
  onSupportClick: () => void;
  onAuthModalClick: () => void;
  onOpenAdmin: () => void;
}

export const MineView: React.FC<MineViewProps> = ({
  onDepositClick,
  onWithdrawClick,
  onOrderClick,
  onSupportClick,
  onAuthModalClick,
  onOpenAdmin,
}) => {
  const {
    user,
    profile,
    transactions,
    signOut,
    updatePaymentMethod,
    isAdmin,
    verifyOwnerAdmin,
  } = useAuth();
  const [editingMoMo, setEditingMoMo] = useState(false);
  const [momoNumber, setMomoNumber] = useState(profile?.momoNumber || profile?.phone || '');
  const [momoProvider, setMomoProvider] = useState(profile?.momoProvider || 'MTN Mobile Money');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerKey, setOwnerKey] = useState('');
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleVerifyOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);
    setVerifying(true);
    const res = await verifyOwnerAdmin(ownerKey);
    setVerifying(false);
    if (res.success) {
      setShowOwnerModal(false);
      setOwnerKey('');
    } else {
      setOwnerError(res.message);
    }
  };

  const vipLevel =
    (profile?.totalInvestedUGX || 0) >= 500000
      ? 'VIP 3'
      : (profile?.totalInvestedUGX || 0) >= 120000
      ? 'VIP'
      : (profile?.totalInvestedUGX || 0) >= 25000
      ? 'VIP 1'
      : 'VIP 0';

  const handleSaveMoMo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePaymentMethod(momoProvider, momoNumber);
    setSaveSuccess(true);
    setEditingMoMo(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Account Suspended Notice if Banned */}
      {profile?.isBanned && (
        <div className="bg-rose-600 text-white p-4 rounded-3xl shadow-lg shadow-rose-600/30 flex items-start gap-3 border border-rose-400">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm uppercase tracking-wide">Account Suspended</h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-rose-700">
                Banned
              </span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              {profile.banReason || 'Your account has been suspended by the platform administrator.'}
            </p>
            <p className="text-[11px] text-rose-200">
              Withdrawals and investments are locked. Contact official Royco WhatsApp or Telegram support to appeal.
            </p>
          </div>
        </div>
      )}

      {/* 1. User Profile Header Card */}
      <div className="bg-gradient-to-r from-[#1764c4] via-[#1d70d6] to-[#1452a0] rounded-3xl p-5 text-white shadow-md shadow-blue-600/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl text-white shadow-inner">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base leading-tight">
                  {profile?.displayName || (user ? 'Royco Investor' : 'Guest Visitor')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider">
                  {vipLevel}
                </span>
                {profile?.isBanned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                    Banned
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 mt-0.5 font-mono">
                {profile?.phone || 'Account ID: ' + (user?.uid.slice(0, 8) || 'Not signed in')}
              </p>
              <div className="text-[10px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                <span>Referral Code:</span>
                <span className="font-mono font-black text-amber-300">
                  {profile?.referralCode || (user ? `ROYCO${user.uid.slice(0, 5).toUpperCase()}` : 'None')}
                </span>
                {profile?.referralCode && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.referralCode);
                      setCopiedRef(true);
                      setTimeout(() => setCopiedRef(false), 2000);
                    }}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition active:scale-90"
                    title="Copy Referral Code"
                  >
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {!user ? (
            <button
              onClick={onAuthModalClick}
              className="px-3 py-1.5 rounded-xl bg-white text-[#1764c4] text-xs font-bold shadow-xs hover:bg-blue-50 transition"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Balance Overview */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-blue-200 font-medium">Available Cash Balance</span>
              <div className="text-2xl font-black tracking-tight text-white mt-0.5">
                UGX {(profile?.balanceUGX || 0).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onDepositClick}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition active:scale-95 shadow-sm"
              >
                Deposit
              </button>
              <button
                onClick={onWithdrawClick}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#1764c4] font-black text-xs transition active:scale-95 shadow-sm"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center text-xs">
            <div>
              <div className="text-[10px] text-blue-200">Total Invested</div>
              <div className="font-extrabold text-white mt-0.5">
                UGX {(profile?.totalInvestedUGX || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-blue-200">Total Yield</div>
              <div className="font-extrabold text-emerald-300 mt-0.5">
                UGX {(profile?.totalEarnedUGX || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-blue-200">Withdrawn</div>
              <div className="font-extrabold text-white mt-0.5">
                UGX {(profile?.totalWithdrawnUGX || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={onOrderClick}
          className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center text-center shadow-xs hover:border-slate-300 transition group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">My Orders</span>
          <span className="text-[10px] text-slate-400">Yield collector</span>
        </button>

        <button
          onClick={onDepositClick}
          className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center text-center shadow-xs hover:border-slate-300 transition group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Recharge</span>
          <span className="text-[10px] text-slate-400">Mobile Money</span>
        </button>

        <button
          onClick={onWithdrawClick}
          className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center text-center shadow-xs hover:border-slate-300 transition group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Withdraw</span>
          <span className="text-[10px] text-slate-400">Fast payout</span>
        </button>
      </div>

      {/* 3. Mobile Money Bound Account Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Mobile Money Payout Account</h4>
              <p className="text-[10px] text-slate-500">Fast automated withdrawals</p>
            </div>
          </div>
          <button
            onClick={() => setEditingMoMo(!editingMoMo)}
            className="text-xs font-bold text-[#1764c4] hover:underline"
          >
            {editingMoMo ? 'Cancel' : 'Change'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mobile Money account updated successfully!</span>
          </div>
        )}

        {editingMoMo ? (
          <form onSubmit={handleSaveMoMo} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMomoProvider('MTN Mobile Money')}
                className={`p-2 rounded-xl border text-xs font-bold ${
                  momoProvider === 'MTN Mobile Money'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setMomoProvider('Airtel Money')}
                className={`p-2 rounded-xl border text-xs font-bold ${
                  momoProvider === 'Airtel Money'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-400'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                Airtel Money
              </button>
            </div>
            <input
              type="text"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              placeholder="e.g. 256771234567"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1764c4] text-white font-bold text-xs hover:bg-[#1353a3] transition"
            >
              Save Payment Channel
            </button>
          </form>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div>
                <div className="font-bold text-slate-800">
                  {profile?.momoProvider || 'MTN Mobile Money'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {profile?.momoNumber || profile?.phone || '25677****129'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Verified
            </span>
          </div>
        )}
      </div>

      {/* 4. Transaction History (Firestore sync) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" /> Financial Records
          </h4>
          <span className="text-[10px] font-bold text-slate-400">
            {transactions.length} records
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No transactions yet. Recharge or invest to start your ledger.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {transactions.map((tx) => {
              const isPositive =
                tx.type === 'deposit' ||
                tx.type === 'daily_yield' ||
                tx.type === 'bonus' ||
                tx.type === 'commission';

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 capitalize">
                      {tx.description || tx.type.replace('_', ' ')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString()} • {tx.method || 'System'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        isPositive ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isPositive ? '+' : '-'}UGX {tx.amountUGX.toLocaleString()}
                    </div>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'withdrawal' && tx.status === 'pending'
                        ? '⏳ Pending Admin Approval'
                        : tx.type === 'withdrawal' && tx.status === 'completed'
                        ? '✓ Paid Out'
                        : tx.type === 'withdrawal' && tx.status === 'rejected'
                        ? '✕ Rejected & Refunded'
                        : tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Administrator Control Panel - strictly invisible to regular users, only visible to owner */}
      {isAdmin && (
        <button
          onClick={onOpenAdmin}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#135bb5] via-[#1052a5] to-[#7c3aed] text-white shadow-md hover:brightness-110 active:scale-98 transition flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide">Administrator Panel</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-amber-950">
                  OWNER
                </span>
              </div>
              <p className="text-[11px] text-blue-200">Confirm deposits, payouts, edit products & user money</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* 6. Support & Security links */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs divide-y divide-slate-100">
        <button
          onClick={onSupportClick}
          className="w-full p-3.5 flex items-center justify-between text-xs text-slate-800 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-cyan-600" />
            <span className="font-semibold">Official 24/7 Customer Care</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <div className="p-3.5 flex items-center justify-between text-xs text-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Security & Fund Protection</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Escrow Guarded
          </span>
        </div>
      </div>

      {/* Discreet Footer with Owner Unlock */}
      <div className="text-center pt-2 pb-1">
        <button
          onClick={() => setShowOwnerModal(true)}
          className="text-[10px] text-slate-400 hover:text-slate-600 transition font-mono tracking-tight"
        >
          ROYCO MIX • {isAdmin ? 'Owner Mode Active' : 'System Secure'}
        </button>
      </div>

      {/* Owner Unlock Verification Modal */}
      {showOwnerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  🔒
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Owner Account Unlock</h4>
                  <p className="text-[10px] text-slate-400">Restricted to authorized system administrators</p>
                </div>
              </div>
              <button
                onClick={() => setShowOwnerModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {ownerError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {ownerError}
              </div>
            )}

            <form onSubmit={handleVerifyOwner} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Administrator Authorization:
                </label>
                <input
                  type="text"
                  value={ownerKey}
                  onChange={(e) => setOwnerKey(e.target.value)}
                  placeholder="Enter administrator ID or authorization key"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition active:scale-95"
              >
                {verifying ? 'Verifying...' : 'Unlock Owner Access'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
