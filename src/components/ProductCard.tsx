import React from 'react';
import { InvestmentProduct } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ProductCardProps {
  product: InvestmentProduct;
  onInvestClick: (product: InvestmentProduct) => void;
  userInvestedCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onInvestClick,
  userInvestedCount = 0,
}) => {
  const { colorConfig } = useTheme();
  const isLimitReached = userInvestedCount >= product.limitPerUser;

  let tagDisplay = product.tag
    ? product.tag
        .replace(/\bhigh\s*return\b/gi, 'VIP2')
        .replace(/\bpopular\b/gi, 'VIP1')
        .replace(/\bhot\s*seller\b/gi, 'VIP4')
        .replace(/\brecommended\b/gi, 'VIP5')
    : '';

  if (product.id === 'royco-cube-plant') {
    tagDisplay = 'VVIP1';
  } else if (product.id === 'royco-agri-plant') {
    tagDisplay = 'VVIP2';
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800/80 bg-[#eef5fa] dark:bg-[#111f35] transition hover:shadow-md">
      {/* 1. Header Banner */}
      <div className={`bg-gradient-to-r ${colorConfig.gradientHeader} px-4 py-2.5 flex items-center justify-between`}>
        <h3 className="text-white font-extrabold text-[15px] tracking-wide uppercase drop-shadow-xs truncate max-w-[240px]">
          {product.name}
        </h3>
        {tagDisplay && (
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${colorConfig.vipTagBg} uppercase tracking-wider shrink-0 shadow-xs`}>
            {tagDisplay}
          </span>
        )}
      </div>

      {/* 2. Main Content Body */}
      <div className="p-3.5">
        <div className="flex gap-3.5 items-center">
          {/* Left: Product Image */}
          <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-inner group">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-1.5">
              <span className="text-[9px] text-white/90 font-medium tracking-tight truncate">
                ROYCO OFFICIAL
              </span>
            </div>
          </div>

          {/* Right: Contract Metrics Specs */}
          <div className="flex-1 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/50 dark:border-slate-750/50">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Contract(Day):</span>
              <span className={`${colorConfig.textAccent} font-bold text-sm`}>{product.contractDays}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/50 dark:border-slate-750/50">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Daily(UGX) :</span>
              <span className={`${colorConfig.textAccent} font-extrabold text-sm`}>
                UGX {product.dailyReturnUGX.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-slate-200/50 dark:border-slate-750/50">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Total(UGX) :</span>
              <span className={`${colorConfig.textAccent} font-extrabold text-sm`}>
                UGX {product.totalReturnUGX.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Limit:</span>
              <span className={`${colorConfig.textAccent} font-bold text-sm`}>
                ({product.limitPerUser - userInvestedCount}/{product.limitPerUser})
              </span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Row: Share Value & Invest Button */}
        <div className="mt-3 pt-3 border-t border-dashed border-[#c5dbe9] dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Share Value:</span>
            <span className={`${colorConfig.textAccent} font-black text-sm md:text-base`}>
              UGX {product.shareValueUGX.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => onInvestClick(product)}
            disabled={isLimitReached}
            className={`px-6 py-2 rounded-xl text-sm font-bold tracking-tight transition active:scale-95 shadow-xs ${
              isLimitReached
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isLimitReached ? 'Limit Max' : 'Invest'}
          </button>
        </div>
      </div>
    </div>
  );
};
