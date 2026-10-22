import React, { useState, useEffect } from 'react';
import { useProducts, BannerSlide } from '../../context/ProductsContext';
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

interface BannerCarouselProps {
  onBannerAction?: (slide: BannerSlide) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ onBannerAction }) => {
  const { settings } = useProducts();
  const banners = settings.banners && settings.banners.length > 0 ? settings.banners : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  const currentSlide = banners[currentIndex] || banners[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div
      className="px-4 pt-3 pb-1"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full h-40 sm:h-44 rounded-2xl overflow-hidden shadow-md border border-[#c9dff0] bg-slate-900 group">
        {/* Background Image */}
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        {/* Slide Content */}
        <div className="absolute inset-0 p-3.5 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {currentSlide.badge || 'Royco Mix Agro'}
            </span>

            <span className="text-[10px] text-white/80 font-mono bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
              {currentIndex + 1} / {banners.length}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-md">
              {currentSlide.title}
            </h3>
            {currentSlide.subtitle && (
              <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed drop-shadow-xs">
                {currentSlide.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Arrows for touch/desktop */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicator Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
