import React, { useState } from 'react';
import { InvestmentProduct } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, Calendar, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InvestModalProps {
  product: InvestmentProduct | null;
  onClose: () => void;
  onOpenDeposit: () => void;
  onViewOrders: () => void;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  product,
  onClose,
  onOpenDeposit,
  onViewOrders,
}) => {
  const { profile, invest } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!product) return null;

  const userBalance = profile?.balanceUGX ?? 0;
  const isSufficient = userBalance >= product.shareValueUGX;
  const deficit = product.shareValueUGX - userBalance;

  const handleConfirm = async () => {
    setSubmitting(true);
    setResultMsg(null);
    try {
      const res = await invest(product);
      if (res.success) {
        setResultMsg({ type: 'success', text: res.message });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setResultMsg({ type: 'error', text: res.message });
      }
    } catch {
      setResultMsg({ type: 'error', text: 'Transaction failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-[#1764c4] to-[#1e76e0] p-4 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
              Contract Order Confirmation
            </span>
            <h3 className="font-extrabold text-base leading-tight mt-0.5">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {resultMsg ? (
            <div className="text-center py-6 space-y-3">
              {resultMsg.type === 'success' ? (
                <>
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Investment Activated!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed px-4">{resultMsg.text}</p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onViewOrders();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#1764c4] text-white font-bold text-xs hover:bg-[#1353a3] transition"
                    >
                      View My Orders
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Could Not Proceed</h4>
                  <p className="text-xs text-rose-600 leading-relaxed px-2">{resultMsg.text}</p>
                  <button
                    onClick={() => setResultMsg(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Product Key Metrics Card */}
              <div className="bg-[#f0f6fb] rounded-2xl p-3.5 border border-[#d2e4f2] space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Coins className="w-4 h-4 text-[#1764c4]" /> Share Capital:
                  </span>
                  <span className="font-extrabold text-[#1764c4] text-sm">
                    UGX {product.shareValueUGX.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Daily Revenue:
                  </span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    UGX {product.dailyReturnUGX.toLocaleString()} / day
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-amber-600" /> Contract Term:
                  </span>
                  <span className="font-bold text-slate-800">{product.contractDays} Days</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-bold">Total Expected Profit:</span>
                  <span className="font-black text-[#1764c4] text-base">
                    UGX {product.totalReturnUGX.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Balance Check */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Current Balance:</span>
                  <div className="font-black text-slate-900 text-sm">
                    UGX {userBalance.toLocaleString()}
                  </div>
                </div>
                {isSufficient ? (
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Sufficient
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                    Short: UGX {deficit.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {isSufficient ? (
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1764c4] to-[#1e76e0] text-white font-black text-sm shadow-md shadow-blue-500/25 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  {submitting ? 'Activating Contract...' : `Confirm & Invest UGX ${product.shareValueUGX.toLocaleString()}`}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-sm shadow-md shadow-amber-500/25 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <span>Deposit UGX {deficit.toLocaleString()} Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-slate-500">
                    Instant recharge via MTN MoMo / Airtel Money supported
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
