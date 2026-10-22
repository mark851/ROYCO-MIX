import React, { useState } from 'react';
import { X, Send, MessageSquareText, ShieldCheck, PhoneCall, Bot } from 'lucide-react';

interface OnlineSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMsg {
  sender: 'agent' | 'user';
  text: string;
  time: string;
}

const FAQS = [
  'How do I deposit with MTN / Airtel Money?',
  'When is my daily yield credited?',
  'How long does a withdrawal take?',
  'Can I invest in multiple packages?',
];

export const OnlineSupportModal: React.FC<OnlineSupportModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      sender: 'agent',
      text: 'Hello! Welcome to ROYCO MIX Official Customer Care. How can we assist with your investments today?',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text) return;

    const userMsg: ChatMsg = {
      sender: 'user',
      text,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'Thank you for contacting ROYCO MIX! Our support desk has verified your inquiry.';
      const lower = text.toLowerCase();

      if (lower.includes('deposit') || lower.includes('mtn') || lower.includes('airtel') || lower.includes('recharge') || lower.includes('pay')) {
        reply = 'To recharge, open "Deposit" and pay directly via our official payment link: https://lworxpaysolutions.com/pay/royco-mix-investment. Enter your Mobile Money number, enter your recharge amount, approve the payment with your PIN, and submit your verification!';
      } else if (lower.includes('yield') || lower.includes('daily') || lower.includes('profit')) {
        reply = 'Daily returns are generated 24 hours after purchasing any equipment share. Open "Order" to claim your daily cash into your wallet anytime!';
      } else if (lower.includes('withdraw') || lower.includes('payout')) {
        reply = 'Withdrawals are processed 24/7 directly to your registered MTN or Airtel phone number. Processing typically settles in under 5 minutes!';
      } else if (lower.includes('multiple') || lower.includes('packages')) {
        reply = 'Yes! You can purchase up to the maximum limit (up to 5 shares per package) across all our culinary processing lines to multiply your daily yields.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: reply,
          time: 'Just now',
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full h-[580px] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-700 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-cyan-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm leading-tight">ROYCO 24/7 Online Support</h3>
              </div>
              <p className="text-[10px] text-cyan-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300 inline" /> Official Service Desk Active
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

        {/* Quick Channels Bar */}
        <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">Quick Channels:</span>
          <div className="flex gap-2">
            <a
              href="https://whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-700 font-bold hover:underline"
            >
              <PhoneCall className="w-3 h-3" /> WhatsApp
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
            >
              <Send className="w-3 h-3" /> Telegram
            </a>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#1764c4] text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Agent is typing...</span>
            </div>
          )}
        </div>

        {/* FAQ Quick Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[10px] whitespace-nowrap">
          {FAQS.map((faq, i) => (
            <button
              key={i}
              onClick={() => handleSend(faq)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-medium transition shrink-0"
            >
              {faq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
