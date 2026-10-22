import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

const TICKER_MESSAGES = [
  '76****4803 11:00 PM recharge UGX500 success',
  '25677****812 11:04 PM recharge UGX25,000 success',
  '70****1924 11:08 PM withdrew UGX85,000 success',
  '25678****441 11:12 PM invested in ROYCO MIX POCKET BLEND',
  '75****9021 11:15 PM recharge UGX35,000 success',
  '25670****559 11:18 PM withdrew UGX100,000 success',
  '78****6732 11:22 PM claimed daily yield UGX2,000',
  '25677****309 11:25 PM invested in ROYCO MIX PORTABLE MINI',
  '76****1182 11:28 PM recharge UGX60,000 success',
  '25675****670 11:32 PM withdrew UGX45,000 success',
];

export const LiveTicker: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TICKER_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-4 my-3 px-3.5 py-2.5 bg-[#e8f2f8] border border-[#d2e3ee] rounded-xl flex items-center gap-3 shadow-xs">
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 animate-pulse">
        <Volume2 className="w-4 h-4" />
      </div>
      <div className="overflow-hidden flex-1 text-xs md:text-sm text-slate-700 font-medium tracking-tight">
        <span
          className={`inline-block transition-opacity duration-300 ${
            fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
          }`}
        >
          {TICKER_MESSAGES[index]}
        </span>
      </div>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white shrink-0">
        LIVE
      </span>
    </div>
  );
};
