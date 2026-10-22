/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { QuickActions } from './components/QuickActions';
import { LiveTicker } from './components/LiveTicker';
import { ProductCard } from './components/ProductCard';
import { BottomNav, NavTab } from './components/BottomNav';
import { FloatingSupport } from './components/FloatingSupport';
import { InvestModal } from './components/InvestModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { OrdersModal } from './components/OrdersModal';
import { BonusModal } from './components/BonusModal';
import { OnlineSupportModal } from './components/OnlineSupportModal';
import { AuthModal } from './components/AuthModal';
import { TeamView } from './components/TeamView';
import { MineView } from './components/MineView';
import { AdminPanel } from './components/admin/AdminPanel';
import { BannerCarousel } from './components/home/BannerCarousel';
import { ProductsProvider, useProducts } from './context/ProductsContext';
import { InvestmentProduct } from './types';
import { TrendingUp, Sparkles, ShieldCheck, CheckCircle } from 'lucide-react';

const CATEGORIES = ['All', 'New User Trial', 'Micro Equipment', 'Processing Unit', 'Industrial Line', 'VIP Investment'];

function MainApp() {
  const { user, profile, activeInvestments, isAdmin } = useAuth();
  const { products } = useProducts();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Capture ?ref=CODE from URL for invitation referral links
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode && refCode.trim()) {
        localStorage.setItem('royco_referred_by', refCode.trim().toUpperCase());
        if (!user) {
          setAuthOpen(true);
        }
      }
    } catch {}
  }, [user]);

  // Filtered dynamic products
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleInvestClick = (prod: InvestmentProduct) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSelectedProduct(prod);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-800 antialiased selection:bg-[#1764c4] selection:text-white">
      {/* Mobile-centric container with max-w-md matching the screenshot phone interface */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col border-x border-slate-200">
        {/* Header */}
        <Header
          onDepositClick={() => {
            if (!user) setAuthOpen(true);
            else setDepositOpen(true);
          }}
          onAuthClick={() => setAuthOpen(true)}
        />

        {/* Tab 1: Home Dashboard (matching user screenshot) */}
        {currentTab === 'home' && (
          <main className="flex-1 pb-24">
            {/* Promotional Banner Carousel (Managed via Admin Panel) */}
            <BannerCarousel />

            {/* Quick Actions (Deposit, Withdraw, Online, Order, Bonus Task) */}
            <QuickActions
              onDepositClick={() => {
                if (!user) setAuthOpen(true);
                else setDepositOpen(true);
              }}
              onWithdrawClick={() => {
                if (!user) setAuthOpen(true);
                else setWithdrawOpen(true);
              }}
              onOnlineClick={() => setSupportOpen(true)}
              onOrderClick={() => {
                if (!user) setAuthOpen(true);
                else setOrdersOpen(true);
              }}
              onBonusClick={() => {
                if (!user) setAuthOpen(true);
                else setBonusOpen(true);
              }}
            />

            {/* Live Ticker matching the screenshot */}
            <LiveTicker />

            {/* Section Heading: "Company Or Stocks" with gradient accent line from screenshot */}
            <div className="px-4 mt-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                  Company Or Stocks
                </h2>
                {/* Horizontal progress gradient accent bar as seen in screenshot */}
                <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-[#1764c4] to-blue-200" />
              </div>
              <span className="text-[11px] font-bold text-[#1764c4] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                50-Day Cycles
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-[#1764c4] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards List */}
            <div className="space-y-1">
              {filteredProducts.map((product) => {
                const count = activeInvestments.filter((i) => i.productId === product.id).length;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userInvestedCount={count}
                    onInvestClick={handleInvestClick}
                  />
                );
              })}
            </div>

            {/* Trust Footer Banner */}
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Uganda Culinary Processing & Micro-Shares</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Guaranteed daily earnings settlement into your wallet. Automated payouts via MTN MoMo and Airtel Money.
              </p>
            </div>
          </main>
        )}

        {/* Tab 2: Product Catalog */}
        {currentTab === 'product' && (
          <main className="flex-1 pb-24 p-4 space-y-4">
            <div className="bg-gradient-to-r from-blue-700 via-[#1764c4] to-indigo-700 p-5 rounded-3xl text-white space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                Equipment Catalog
              </span>
              <h2 className="text-xl font-black">All Royco Production Lines</h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Select your preferred unit size to participate in high-volume food processing and generate steady daily UGX cash flow.
              </p>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#1764c4] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const count = activeInvestments.filter((i) => i.productId === product.id).length;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userInvestedCount={count}
                    onInvestClick={handleInvestClick}
                  />
                );
              })}
            </div>
          </main>
        )}

        {/* Tab 3: Bonus Center */}
        {currentTab === 'bonus' && (
          <main className="flex-1 pb-24">
            <div className="p-4">
              <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-5 rounded-3xl text-white space-y-2 shadow-sm mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200">
                  Rewards Hub
                </span>
                <h2 className="text-xl font-black">Daily Cash Rewards</h2>
                <p className="text-xs text-rose-100">
                  Claim your attendance checks and spin the lucky prize wheel for instant UGX bonuses!
                </p>
              </div>

              <button
                onClick={() => {
                  if (!user) setAuthOpen(true);
                  else setBonusOpen(true);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition"
              >
                <Sparkles className="w-5 h-5" />
                <span>Open Bonus Task Center (Check-in & Wheel)</span>
              </button>
            </div>
          </main>
        )}

        {/* Tab 4: Team View */}
        {currentTab === 'team' && (
          <main className="flex-1">
            <TeamView onAuthRequired={() => setAuthOpen(true)} />
          </main>
        )}

        {/* Tab 5: Mine (Profile & Financial center) */}
        {currentTab === 'mine' && (
          <main className="flex-1">
            <MineView
              onDepositClick={() => {
                if (!user) setAuthOpen(true);
                else setDepositOpen(true);
              }}
              onWithdrawClick={() => {
                if (!user) setAuthOpen(true);
                else setWithdrawOpen(true);
              }}
              onOrderClick={() => {
                if (!user) setAuthOpen(true);
                else setOrdersOpen(true);
              }}
              onSupportClick={() => setSupportOpen(true)}
              onAuthModalClick={() => setAuthOpen(true)}
              onOpenAdmin={() => setAdminOpen(true)}
            />
          </main>
        )}

        {/* Floating Quick Admin Trigger Badge - Only visible to owner account (markniaras@gmail.com) */}
        {isAdmin && (
          <button
            onClick={() => setAdminOpen(true)}
            title="Open Admin Control Panel"
            className="fixed left-3 bottom-20 z-40 px-2.5 py-1.5 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 text-[10px] font-black shadow-lg border border-slate-700 backdrop-blur-xs flex items-center gap-1.5 transition active:scale-95 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>⚡ Admin</span>
          </button>
        )}

        {/* Floating Support buttons matching screenshot on bottom right */}
        <FloatingSupport
          onWhatsAppClick={() => setSupportOpen(true)}
          onTelegramClick={() => setSupportOpen(true)}
        />

        {/* Bottom Nav Bar matching screenshot */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeOrdersCount={activeInvestments.length}
        />

        {/* Modals */}
        <InvestModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenDeposit={() => setDepositOpen(true)}
          onViewOrders={() => {
            setCurrentTab('mine');
            setOrdersOpen(true);
          }}
        />

        <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />

        <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

        <OrdersModal
          isOpen={ordersOpen}
          onClose={() => setOrdersOpen(false)}
          onExploreProducts={() => {
            setOrdersOpen(false);
            setCurrentTab('home');
          }}
        />

        <BonusModal isOpen={bonusOpen} onClose={() => setBonusOpen(false)} />

        <OnlineSupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

        {/* Full-Featured Admin Panel - strictly for owner account */}
        {isAdmin && <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <MainApp />
      </ProductsProvider>
    </AuthProvider>
  );
}
