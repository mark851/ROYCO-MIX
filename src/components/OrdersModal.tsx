import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ClipboardList, CheckCircle2, Clock, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreProducts: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  onExploreProducts,
}) => {
  const { activeInvestments, claimYield } = useAuth();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleClaim = async (invId: string) => {
    setClaimingId(invId);
    setClaimFeedback(null);
    try {
      const res = await claimYield(invId);
      setClaimFeedback({ id: invId, ...res });
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch {
      setClaimFeedback({ id: invId, success: false, message: 'Failed to claim daily yield' });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">My Investment Orders</h3>
              <p className="text-[11px] text-amber-100 font-medium">
                {activeInvestments.length} Active Production Contracts
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

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {activeInvestments.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Active Investment Orders</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You haven&apos;t joined any Royco Mix production contracts yet. Explore packages to start earning daily UGX returns!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onExploreProducts();
                }}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#1764c4] text-white text-xs font-bold hover:bg-[#1353a3] transition active:scale-95 shadow-md shadow-blue-500/20"
              >
                Browse Investment Packages
              </button>
            </div>
          ) : (
            activeInvestments.map((order) => {
              const isClaimedToday = order.lastClaimDate === todayStr;
              const progressPct = Math.min(100, Math.round(((order.daysElapsed || 1) / order.contractDays) * 100));

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-[#bcd7ec] transition space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {order.status === 'completed' ? 'CONTRACT COMPLETED' : 'PRODUCING YIELD'}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">{order.productName}</h4>
                      <p className="text-[10px] text-slate-400">Order ID: {order.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-medium">Daily Income:</span>
                      <div className="text-xs font-black text-emerald-600">
                        +UGX {order.dailyReturnUGX.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Term Progress: Day {order.daysElapsed} of {order.contractDays}</span>
                      <span className="font-bold text-[#1764c4]">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1764c4] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400">Invested Capital</span>
                      <div className="font-bold text-slate-800">
                        UGX {order.shareValueUGX.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Claimed So Far</span>
                      <div className="font-bold text-emerald-600">
                        UGX {(order.claimedReturnUGX || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Claim feedback if any */}
                  {claimFeedback && claimFeedback.id === order.id && (
                    <div
                      className={`p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                        claimFeedback.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {claimFeedback.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{claimFeedback.message}</span>
                    </div>
                  )}

                  {/* Claim Button */}
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => handleClaim(order.id)}
                      disabled={isClaimedToday || claimingId === order.id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        isClaimedToday
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:brightness-105'
                      }`}
                    >
                      {isClaimedToday ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Today&apos;s Yield Claimed (Check back tomorrow)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {claimingId === order.id
                              ? 'Crediting Yield...'
                              : `Claim Daily UGX ${order.dailyReturnUGX.toLocaleString()}`}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
