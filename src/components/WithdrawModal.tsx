import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, AlertCircle, Landmark, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { profile, withdraw } = useAuth();
  const [method, setMethod] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountNumber, setAccountNumber] = useState<string>(profile?.momoNumber || profile?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentBalance = profile?.balanceUGX ?? 0;
  const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
  const fee = Math.round(numAmount * 0.05);
  const netAmount = Math.max(0, numAmount - fee);
  const hasEnough = currentBalance >= numAmount && numAmount >= 5000;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnough) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await withdraw(numAmount, method, accountNumber);
      setFeedback(res);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch {
      setFeedback({ success: false, message: 'Withdrawal failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Withdraw Cash</h3>
              <p className="text-[11px] text-blue-100 font-medium">Fast Payout to Mobile Money</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {feedback ? (
            <div className="text-center py-6 space-y-3">
              {feedback.success ? (
                <>
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border-4 border-amber-50">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      Pending Admin Manual Approval
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1.5">Withdrawal Request Pending</h4>
                    <p className="text-xs text-slate-600 leading-relaxed px-2 mt-1">
                      {feedback.message}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Admin Status:</span>
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                        Awaiting Admin Approval
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Payout Channel:</span>
                      <span className="font-bold text-slate-800">{method}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Destination Account:</span>
                      <span className="font-mono font-bold text-slate-800">{accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>Gross Amount:</span>
                      <span className="font-bold text-slate-800">UGX {amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Service Fee (5%):</span>
                      <span className="font-bold text-rose-600">- UGX {fee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1.5 text-sm">
                      <span>Net Payout to Receive:</span>
                      <span className="text-emerald-700">UGX {netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center px-1">
                    The platform administrator will manually verify and approve your request in the Admin Panel before transferring funds.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition active:scale-95"
                  >
                    Done & View Records
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Request Denied</h4>
                  <p className="text-xs text-rose-600 leading-relaxed px-2">{feedback.message}</p>
                  <button
                    onClick={() => setFeedback(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition"
                  >
                    Adjust Amount
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Balance Banner */}
              <div className="bg-[#eef5fa] p-3 rounded-2xl border border-[#d2e4f2] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Available Cash:</span>
                  <div className="text-base font-black text-[#1764c4]">
                    UGX {currentBalance.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(currentBalance)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#1764c4] text-white rounded-lg hover:bg-[#1353a3] transition active:scale-95"
                >
                  All Out
                </button>
              </div>

              {/* Provider */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payout Channel:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('MTN Mobile Money')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      method === 'MTN Mobile Money'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400/30'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <span>🟡</span> MTN MoMo
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('Airtel Money')}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      method === 'Airtel Money'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    <span>🔴</span> Airtel Money
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Withdraw Amount (UGX):</label>
                  <span className="text-[10px] text-slate-500">Min: UGX 5,000</span>
                </div>
                <input
                  type="number"
                  min="5000"
                  max={currentBalance}
                  step="1000"
                  value={amount === '' || amount === 0 ? '' : amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmount(val === '' ? '' : Number(val));
                  }}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Payout Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Mobile Money Number:
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 256771234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Fee Breakdown */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Processing Fee (5%):</span>
                  <span>UGX {fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
                  <span>Net Payout to Receive:</span>
                  <span className="text-emerald-600">UGX {netAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !hasEnough}
                className={`w-full py-3 rounded-xl text-white font-black text-sm shadow-md transition flex items-center justify-center gap-1.5 ${
                  hasEnough
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 active:scale-95 shadow-blue-500/25'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Processing Payout...' : `Confirm Withdrawal UGX ${amount.toLocaleString()}`}
              </button>

              <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500 inline" /> Payouts processed 24/7 directly to MTN/Airtel
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
