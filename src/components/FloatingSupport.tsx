import React from 'react';
import { PhoneCall, Send } from 'lucide-react';

interface FloatingSupportProps {
  onWhatsAppClick: () => void;
  onTelegramClick: () => void;
}

export const FloatingSupport: React.FC<FloatingSupportProps> = ({
  onWhatsAppClick,
  onTelegramClick,
}) => {
  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col gap-2.5">
      {/* WhatsApp / Call button */}
      <button
        onClick={onWhatsAppClick}
        aria-label="WhatsApp Support"
        className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all group"
      >
        <PhoneCall className="w-5 h-5 fill-white stroke-none group-hover:rotate-12 transition-transform" />
      </button>

      {/* Telegram / Chat button */}
      <button
        onClick={onTelegramClick}
        aria-label="Telegram Channel"
        className="w-11 h-11 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all group"
      >
        <Send className="w-5 h-5 fill-white stroke-none -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};
