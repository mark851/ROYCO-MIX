import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import {
  X,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetAmount?: number;
}

const PRESET_AMOUNTS = [10000, 25000, 35000, 50000, 100000, 250000, 500000];

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  presetAmount = 25000,
}) => {
  const { profile, deposit } = useAuth();
  const { settings } = useProducts();
  const [selectedMethod, setSelectedMethod] = useState<'MTN Mobile Money' | 'Airtel Money'>('MTN Mobile Money');
  const [amount, setAmount] = useState<number>(presetAmount);
  const [phone, setPhone] = useState<string>(profile?.phone || '25677' + Math.floor(1000000 + Math.random() * 9000000));
  const [txRef, setTxRef] = useState<string>('');
  const [asPending, setAsPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const activePaymentLink = settings?.paymentLink || 'https://lworxpaysolutions.com/pay/royco-mix-investment';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activePaymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecharge = async (pendingMode: boolean) => {
    if (amount <= 0) return;

    setSubmitting(true);
    try {
      const ok = await deposit(amount, selectedMethod, phone, pendingMode, txRef || undefined);
      if (ok) {
        setAsPending(pendingMode);
        setSuccess(true);
        confetti({
          particleCount: pendingMode ? 70 : 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setTxRef('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Deposit / Recharge</h3>
              <p className="text-[11px] text-amber-100 font-medium">Instant UGX Mobile Money Credit</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {success ? (
            <div className="text-center py-4 space-y-3">
              <div
                className={`w-14 h-14 ${
                  asPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                } rounded-full flex items-center justify-center mx-auto`}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                {asPending ? 'Recharge Verification Submitted!' : 'Recharge Successful!'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed px-2">
                {asPending
                  ? `Your payment request of UGX ${amount.toLocaleString()} via Lworx Pay Solutions has been received. Our automated system is verifying your transaction and will credit your wallet shortly.`
                  : `UGX ${amount.toLocaleString()} has been credited to your ROYCO MIX wallet balance via ${selectedMethod}.`}
              </p>

              <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-200">
                <div className="flex justify-between text-slate-500">
                  <span>Channel:</span>
                  <span className="font-bold text-slate-800">{selectedMethod}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Account Number:</span>
                  <span className="font-bold text-slate-800">{phone}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Gateway:</span>
                  <span className="font-bold text-slate-800">Lworx Pay Solutions</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Amount:</span>
                  <span className="font-bold text-emerald-600">UGX {amount.toLocaleString()}</span>
                </div>
                {txRef && (
                  <div className="flex justify-between text-slate-500">
                    <span>Reference / Tx ID:</span>
                    <span className="font-mono font-bold text-slate-800">{txRef}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className={`font-bold ${asPending ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {asPending ? 'PENDING VERIFICATION' : 'CONFIRMED (INSTANT)'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-[#1764c4] text-white font-bold text-sm hover:bg-[#1353a3] transition active:scale-95 shadow-md shadow-blue-500/20"
              >
                {asPending ? 'Done (Return to Dashboard)' : 'Start Investing Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Channel Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Mobile Money Provider:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MTN Mobile Money')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                      selectedMethod === 'MTN Mobile Money'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0">
                      MTN
                    </div>
                    <div className="truncate text-xs">
                      <div>MTN MoMo</div>
                      <div className="text-[10px] text-slate-500">Uganda</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('Airtel Money')}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition ${
                      selectedMethod === 'Airtel Money'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-400/40'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      AIR
                    </div>
                    <div className="truncate text-xs">
                      <div>Airtel Money</div>
                      <div className="text-[10px] text-rose-600 font-bold">Uganda</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Amount Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Choose Recharge Amount (UGX):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition ${
                        amount === amt
                          ? 'bg-[#1764c4] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Amount (UGX):
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Your Phone Number:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 256771234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                    required
                  />
                </div>
              </div>

              {/* Payment Gateway Box with Direct Link */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-purple-50 rounded-2xl border-2 border-blue-200 p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                      Official Payment Gateway Link
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-[11px] font-bold text-[#1764c4] transition active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>

                {/* The Link URL Card */}
                <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-blue-200/90 flex items-center justify-between gap-2 shadow-xs">
                  <div className="truncate text-xs font-mono font-bold text-slate-800">
                    {activePaymentLink}
                  </div>
                  <a
                    href={activePaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shrink-0"
                    title="Open Link in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Big Button to open payment link */}
                <a
                  href={activePaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-[#1764c4] to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 group"
                >
                  <span>Click to Pay UGX {amount.toLocaleString()} on Lworx Pay</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </a>

                {/* Step-by-Step Instructions: How to pay using the link */}
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100 space-y-2">
                  <div className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 border-b border-blue-100 pb-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">i</span>
                    <span>How to Pay using the Payment Link:</span>
                  </div>

                  <ol className="space-y-1.5 text-[11px] text-slate-700 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Click the blue <strong className="text-blue-900 font-bold">"Click to Pay on Lworx Pay"</strong> button above (or open the payment link).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        On the secure payment page, enter your Mobile Money phone number (<strong className="text-slate-900 font-semibold">{phone || '07...'}</strong>) and enter amount <strong className="text-emerald-700 font-bold">UGX {amount.toLocaleString()}</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        You will receive an instant prompt on your phone. Enter your <strong className="text-slate-900 font-bold">Mobile Money PIN</strong> to authorize the transfer.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <span>
                        Once completed, return here and click <strong className="text-amber-700 font-bold">"Submit Payment Verification"</strong> below so your wallet balance is updated!
                      </span>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Optional Reference / Transaction ID Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Reference / Transaction ID (Optional):
                </label>
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. LWORX-XXXX or MoMo TxID"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={submitting || amount <= 0}
                  onClick={() => handleRecharge(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-black text-xs shadow-md shadow-amber-500/25 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Submitting Verification...' : `Submit Payment Verification (UGX ${amount.toLocaleString()})`}
                </button>

                <button
                  type="button"
                  disabled={submitting || amount <= 0}
                  onClick={() => handleRecharge(false)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition active:scale-95 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <span>⚡ Instant Direct Credit (Demo Test)</span>
                </button>
              </div>

              <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-0.5">
                <Lock className="w-3 h-3 text-emerald-500 inline" />
                <span>256-Bit SSL Encrypted • Official Royco & Lworx Pay Solutions</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
