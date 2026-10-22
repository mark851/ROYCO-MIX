import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import {
  UserProfile,
  InvestmentOrder,
  FinancialTransaction,
  InvestmentProduct,
} from '../../types';
import { useProducts } from '../../context/ProductsContext';
import {
  X,
  Menu,
  Bell,
  Home,
  BarChart3,
  FileText,
  Landmark,
  Users,
  MessageSquare,
  ClipboardList,
  Layers,
  Award,
  CreditCard,
  Settings,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Image as ImageIcon,
  Upload,
  Copy,
  Clock,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageUploadManager } from './ImageUploadManager';
import { BannerSlide, DEFAULT_BANNERS } from '../../context/ProductsContext';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'investment_report'
  | 'deposits'
  | 'withdrawals'
  | 'manage_users'
  | 'plan_manage'
  | 'banners_media'
  | 'payment_gateways'
  | 'support'
  | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user, profile, isAdmin } = useAuth();
  const { products, settings, updateProduct, addProduct, deleteProduct, updateSettings, resetToDefaults } = useProducts();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Live Firestore datasets
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]);
  const [allInvestments, setAllInvestments] = useState<InvestmentOrder[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'all' | 'completed' | 'rejected'>('pending');
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null);

  // Settings State initialized from dynamic settings
  const [paymentLink, setPaymentLink] = useState(
    settings.paymentLink || 'https://lworxpaysolutions.com/pay/royco-mix-investment'
  );
  const [withdrawLink, setWithdrawLink] = useState(settings.withdrawLink || 'https://momo.ug/payout/royco');
  const [whatsappLink, setWhatsappLink] = useState(settings.whatsapp || '+256770000000');
  const [telegramLink, setTelegramLink] = useState(settings.telegram || 'https://t.me/roycomix_ug');
  const [trialBonusUGX, setTrialBonusUGX] = useState(settings.trialBonusUGX || 3000);

  // Sync settings when updated
  useEffect(() => {
    if (settings) {
      if (settings.paymentLink) setPaymentLink(settings.paymentLink);
      setWithdrawLink(settings.withdrawLink);
      setWhatsappLink(settings.whatsapp);
      setTelegramLink(settings.telegram);
      setTrialBonusUGX(settings.trialBonusUGX);
    }
  }, [settings]);

  // Modals inside Admin
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<string>('0');
  const [balanceMode, setBalanceMode] = useState<'add' | 'subtract' | 'set'>('add');

  const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InvestmentProduct | null>(null);
  const [resetCatalogOpen, setResetCatalogOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productHighlightsText, setProductHighlightsText] = useState('');
  const [productDescriptionText, setProductDescriptionText] = useState('');

  // Quick image manager & Banners states
  const [quickImageProduct, setQuickImageProduct] = useState<InvestmentProduct | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerSlide | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cronTime, setCronTime] = useState(53);

  // Simulated cron counter matching screenshot
  useEffect(() => {
    const timer = setInterval(() => {
      setCronTime((prev) => (prev >= 60 ? 5 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Listen for all users
  useEffect(() => {
    if (!isOpen) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users = snapshot.docs.map((docSnap) => docSnap.data() as UserProfile);
        setAllUsers(users);
      },
      (err) => {
        console.warn('Admin user fetch note:', err);
      }
    );

    const unsubTx = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const txs = snapshot.docs.map((docSnap) => docSnap.data() as FinancialTransaction);
        txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllTransactions(txs);
      },
      (err) => {
        console.warn('Admin tx fetch note:', err);
      }
    );

    const unsubInv = onSnapshot(
      collection(db, 'investments'),
      (snapshot) => {
        const invs = snapshot.docs.map((docSnap) => docSnap.data() as InvestmentOrder);
        setAllInvestments(invs);
      },
      (err) => {
        console.warn('Admin inv fetch note:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubTx();
      unsubInv();
    };
  }, [isOpen]);

  if (!isOpen || !isAdmin) return null;

  // Filtered transactions
  const depositRequests = allTransactions.filter((t) => t.type === 'deposit');
  const withdrawalRequests = allTransactions.filter((t) => t.type === 'withdrawal');
  const pendingDeposits = depositRequests.filter((t) => t.status === 'pending');
  const pendingWithdrawals = withdrawalRequests.filter((t) => t.status === 'pending');
  const completedWithdrawals = withdrawalRequests.filter((t) => t.status === 'completed');
  const rejectedWithdrawals = withdrawalRequests.filter((t) => t.status === 'rejected');

  const filteredWithdrawals = withdrawalFilter === 'all'
    ? withdrawalRequests
    : withdrawalRequests.filter((t) => t.status === withdrawalFilter);

  const handleCopyAcc = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedAcc(num);
    setTimeout(() => setCopiedAcc(null), 2000);
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // 1. Confirm / Reject Deposit
  const handleApproveDeposit = async (tx: FinancialTransaction) => {
    try {
      // 1. Mark transaction completed
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'completed',
        approvedAt: new Date().toISOString(),
      });

      // 2. Credit user's balance
      const targetUser = allUsers.find((u) => u.uid === tx.userId);
      if (targetUser) {
        const newBal = (targetUser.balanceUGX || 0) + tx.amountUGX;
        await updateDoc(doc(db, 'users', tx.userId), {
          balanceUGX: newBal,
          updatedAt: new Date().toISOString(),
        });
      }

      confetti({ particleCount: 50, spread: 60 });
      showNotification('success', `Deposit of UGX ${tx.amountUGX.toLocaleString()} approved and credited!`);
    } catch (err) {
      showNotification('error', 'Failed to approve deposit');
    }
  };

  const handleRejectDeposit = async (tx: FinancialTransaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      });
      showNotification('success', 'Deposit request rejected');
    } catch (err) {
      showNotification('error', 'Failed to reject deposit');
    }
  };

  // 2. Confirm / Reject Withdrawal (Manual Admin Verification)
  const handleApproveWithdrawal = async (tx: FinancialTransaction) => {
    try {
      const now = new Date().toISOString();
      // 1. Mark transaction as completed and store approval timestamp
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'completed',
        approvedAt: now,
      });

      // 2. Update user's totalWithdrawnUGX
      const targetUser = allUsers.find((u) => u.uid === tx.userId);
      if (targetUser) {
        await updateDoc(doc(db, 'users', tx.userId), {
          totalWithdrawnUGX: (targetUser.totalWithdrawnUGX || 0) + tx.amountUGX,
          updatedAt: now,
        });
      }

      confetti({ particleCount: 50, spread: 60 });
      showNotification(
        'success',
        `Withdrawal of UGX ${(tx.netAmountUGX || tx.amountUGX).toLocaleString()} to ${tx.accountNumber} approved and confirmed!`
      );
    } catch (err) {
      showNotification('error', 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (tx: FinancialTransaction) => {
    try {
      const now = new Date().toISOString();
      // 1. Mark transaction as rejected and store rejection timestamp
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'rejected',
        rejectedAt: now,
      });

      // 2. Refund balance back to user's wallet
      const targetUser = allUsers.find((u) => u.uid === tx.userId);
      if (targetUser) {
        const refundedBal = (targetUser.balanceUGX || 0) + tx.amountUGX;
        await updateDoc(doc(db, 'users', tx.userId), {
          balanceUGX: refundedBal,
          updatedAt: now,
        });
      }

      showNotification(
        'success',
        `Withdrawal of UGX ${tx.amountUGX.toLocaleString()} rejected and fully refunded to user's balance`
      );
    } catch (err) {
      showNotification('error', 'Failed to reject withdrawal');
    }
  };

  // 3. User Money / Balance Edit
  const handleSaveUserBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const deltaNum = Number(balanceDelta) || 0;
    let newBalance = editingUser.balanceUGX;

    if (balanceMode === 'add') {
      newBalance = editingUser.balanceUGX + deltaNum;
    } else if (balanceMode === 'subtract') {
      newBalance = Math.max(0, editingUser.balanceUGX - deltaNum);
    } else {
      newBalance = Math.max(0, deltaNum);
    }

    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        balanceUGX: newBalance,
        updatedAt: new Date().toISOString(),
      });

      // Log admin adjustment transaction
      const adjTxId = 'tx_adj_' + Date.now();
      const adjTx: FinancialTransaction = {
        id: adjTxId,
        userId: editingUser.uid,
        userEmail: editingUser.email || 'user@roycomix.ug',
        type: 'bonus',
        amountUGX: Math.abs(newBalance - editingUser.balanceUGX),
        feeUGX: 0,
        netAmountUGX: Math.abs(newBalance - editingUser.balanceUGX),
        method: 'Admin Manual Adjustment',
        status: 'completed',
        reference: 'ADMIN-ADJUSTMENT',
        description: `Admin manual balance adjustment to UGX ${newBalance.toLocaleString()}`,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'transactions', adjTxId), adjTx);

      setEditingUser(null);
      setBalanceDelta('0');
      showNotification('success', `Updated user balance to UGX ${newBalance.toLocaleString()}`);
    } catch (err) {
      showNotification('error', 'Failed to update user balance');
    }
  };

  // Product helper actions
  const openEditProduct = (prod: InvestmentProduct) => {
    setIsNewProduct(false);
    setEditingProduct({ ...prod });
    setProductHighlightsText((prod.highlights || []).join(', '));
    setProductDescriptionText(prod.description || '');
  };

  const openNewProduct = () => {
    setIsNewProduct(true);
    const newProd: InvestmentProduct = {
      id: 'royco-plan-' + Date.now(),
      name: 'ROYCO MIX NEW PRODUCTION LINE',
      category: 'Processing Unit',
      tag: 'New',
      shareValueUGX: 50000,
      dailyReturnUGX: 3000,
      contractDays: 50,
      totalReturnUGX: 150000,
      limitPerUser: 5,
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
      description: 'Modern spice grinding and automated packaging unit with automated daily returns.',
      highlights: ['Automated Yield', 'Fast ROI', 'Daily Payout'],
    };
    setEditingProduct(newProd);
    setProductHighlightsText(newProd.highlights.join(', '));
    setProductDescriptionText(newProd.description);
  };

  // 4. Save Product / Plan Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const highlights = productHighlightsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const calculatedTotal =
      (Number(editingProduct.dailyReturnUGX) || 0) * (Number(editingProduct.contractDays) || 1);

    const productToSave: InvestmentProduct = {
      ...editingProduct,
      shareValueUGX: Math.max(100, Number(editingProduct.shareValueUGX) || 1000),
      dailyReturnUGX: Math.max(0, Number(editingProduct.dailyReturnUGX) || 0),
      contractDays: Math.max(1, Number(editingProduct.contractDays) || 1),
      totalReturnUGX: calculatedTotal,
      limitPerUser: Math.max(1, Number(editingProduct.limitPerUser) || 1),
      description: productDescriptionText.trim() || editingProduct.description || '',
      highlights: highlights.length > 0 ? highlights : ['Automated Yield', 'Daily Payout'],
    };

    try {
      if (isNewProduct) {
        await addProduct(productToSave);
        showNotification('success', `Created new package: ${productToSave.name}`);
      } else {
        await updateProduct(productToSave);
        showNotification('success', `Updated package: ${productToSave.name}`);
      }
      setEditingProduct(null);
      setIsNewProduct(false);
    } catch (err) {
      showNotification('error', 'Failed to save product to database');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      showNotification('success', `Product "${productToDelete.name}" deleted permanently`);
      if (editingProduct?.id === productToDelete.id) {
        setEditingProduct(null);
      }
      setProductToDelete(null);
    } catch (err) {
      showNotification('error', 'Failed to delete product from database');
    }
  };

  const handleResetCatalog = async () => {
    try {
      await resetToDefaults();
      showNotification('success', 'Reset catalog to 7 default Royco Mix packages');
      setResetCatalogOpen(false);
    } catch (err) {
      showNotification('error', 'Failed to reset product catalog');
    }
  };

  // Banner slides helpers
  const currentBanners = settings.banners && settings.banners.length > 0 ? settings.banners : DEFAULT_BANNERS;

  const openNewBanner = () => {
    setIsNewBanner(true);
    setEditingBanner({
      id: `banner-${Date.now()}`,
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      title: 'Royco Mix Agro Production Line',
      subtitle: 'Daily automated ROI payouts directly to Mobile Money',
      badge: 'Hot Investment',
    });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    const list = [...currentBanners];
    if (isNewBanner) {
      list.unshift(editingBanner);
    } else {
      const idx = list.findIndex((b) => b.id === editingBanner.id);
      if (idx >= 0) {
        list[idx] = editingBanner;
      } else {
        list.unshift(editingBanner);
      }
    }
    await updateSettings({ banners: list });
    showNotification('success', 'Banner slide updated & saved to Firestore!');
    setEditingBanner(null);
    setIsNewBanner(false);
  };

  const handleRemoveBanner = async (bannerId: string) => {
    const filtered = currentBanners.filter((b) => b.id !== bannerId);
    await updateSettings({ banners: filtered });
    showNotification('success', 'Banner slide removed from homepage');
    setBannerToDelete(null);
  };

  const handleResetBanners = async () => {
    await updateSettings({ banners: DEFAULT_BANNERS });
    showNotification('success', 'Reset homepage banners to default slides');
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageProduct) return;
    await updateProduct(quickImageProduct);
    showNotification('success', `Updated image for "${quickImageProduct.name}"`);
    setQuickImageProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-3 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-[#0b1728] w-full max-w-4xl h-full md:h-[94vh] rounded-none md:rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-slate-700/60 text-slate-100 relative">
        
        {/* Floating Notification */}
        {notificationMsg && (
          <div
            className={`absolute top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all ${
              notificationMsg.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {notificationMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notificationMsg.text}</span>
          </div>
        )}

        {/* =========================================================================
            LEFT SIDEBAR DRAWER (REPLICATING USER SCREENSHOT STYLING & BLUE GRADIENT)
           ========================================================================= */}
        <aside
          className={`${
            sidebarOpen ? 'w-full md:w-64' : 'hidden md:block md:w-20'
          } bg-gradient-to-b from-[#135bb5] via-[#1052a5] to-[#0c3d7c] border-r border-blue-400/20 flex flex-col transition-all duration-300 z-30 shrink-0`}
        >
          {/* Sidebar Top: Logo & Close Button */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-base shadow-inner shrink-0">
                RM
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <h2 className="font-black text-sm tracking-wide text-white">ROYCO ADMIN</h2>
                  <p className="text-[10px] text-blue-200">Management Panel</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition md:flex hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition md:hidden flex"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Matching screenshot menu hierarchy) */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            {/* 1. Dashboard */}
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-bold ${
                currentTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            {/* 2. Investment Report */}
            <button
              onClick={() => setCurrentTab('investment_report')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium ${
                currentTab === 'investment_report'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Investment Report</span>}
            </button>

            {/* 3. Deposits (with pending badge) */}
            <button
              onClick={() => setCurrentTab('deposits')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'deposits'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Deposits</span>}
              </div>
              {sidebarOpen && pendingDeposits.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                  {pendingDeposits.length}
                </span>
              )}
            </button>

            {/* 4. Withdrawals (with pending badge) */}
            <button
              onClick={() => setCurrentTab('withdrawals')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'withdrawals'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Landmark className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Withdrawals</span>}
              </div>
              {sidebarOpen && pendingWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>

            {/* 5. Manage Users */}
            <button
              onClick={() => setCurrentTab('manage_users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'manage_users'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Manage Users</span>}
              </div>
              {sidebarOpen && (
                <span className="text-[10px] text-blue-200">{allUsers.length}</span>
              )}
            </button>

            {/* 6. Plan Manage (Editing Products, Images & Investments) */}
            <button
              onClick={() => setCurrentTab('plan_manage')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'plan_manage'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Plan Manage (Products)</span>}
              </div>
              {sidebarOpen && (
                <span className="text-[10px] text-blue-200">{products.length}</span>
              )}
            </button>

            {/* 6b. Banners & Media (Hero Slides, Uploads, Image Removal) */}
            <button
              onClick={() => setCurrentTab('banners_media')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'banners_media'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Banners & Media</span>}
              </div>
              {sidebarOpen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                  {currentBanners.length}
                </span>
              )}
            </button>

            {/* 7. Payment Gateway Link & Payout Channels */}
            <button
              onClick={() => setCurrentTab('payment_gateways')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'payment_gateways'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Payment Gateway Link</span>}
            </button>

            {/* 8. Support Tickets */}
            <button
              onClick={() => setCurrentTab('support')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'support'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Support Details</span>}
            </button>

            {/* Section: SETTINGS */}
            {sidebarOpen && (
              <div className="pt-3 pb-1 px-3 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Settings
              </div>
            )}

            {/* 9. General Setting */}
            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>General Setting</span>}
            </button>
          </nav>

          {/* Sidebar Bottom: Return to App */}
          <div className="p-3 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {sidebarOpen && <span>Back to Main Website</span>}
            </button>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT MAIN ADMIN CONTENT AREA
           ========================================================================= */}
        <div className="flex-1 flex flex-col bg-[#0d1b2e] overflow-hidden">
          {/* Top Bar matching screenshot */}
          <header className="px-4 py-3 bg-[#11233d] border-b border-slate-700/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Cron Run:</span>
                <span className="text-xs font-black text-indigo-400">{cronTime} seconds ago</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification icon with count 35 matching screenshot */}
              <div className="relative">
                <button
                  onClick={() => setCurrentTab('deposits')}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
                >
                  <Bell className="w-4 h-4" />
                </button>
                {(pendingDeposits.length + pendingWithdrawals.length) > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                    {pendingDeposits.length + pendingWithdrawals.length}
                  </span>
                )}
              </div>

              {/* Close Button matching screenshot square purple button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center font-bold transition"
                title="Exit Admin Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Scrollable View Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {/* -------------------------------------------------------------
                TAB 1: DASHBOARD (Matching screenshot tiles and quick actions)
               ------------------------------------------------------------- */}
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 1. Key Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#152a48] border border-blue-500/20 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Users</span>
                    <div className="text-xl font-black text-white">{allUsers.length} Members</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Real-time Firestore sync
                    </div>
                  </div>

                  <div className="bg-[#152a48] border border-blue-500/20 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pending Deposits</span>
                    <div className="text-xl font-black text-amber-400">{pendingDeposits.length} Requests</div>
                    <button
                      onClick={() => setCurrentTab('deposits')}
                      className="text-[10px] text-blue-300 font-bold hover:underline"
                    >
                      Review & Approve →
                    </button>
                  </div>

                  <div className="bg-[#152a48] border border-blue-500/20 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pending Withdrawals</span>
                    <div className="text-xl font-black text-rose-400">{pendingWithdrawals.length} Requests</div>
                    <button
                      onClick={() => setCurrentTab('withdrawals')}
                      className="text-[10px] text-rose-300 font-bold hover:underline"
                    >
                      Process Payouts →
                    </button>
                  </div>

                  <div className="bg-[#152a48] border border-blue-500/20 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Active Contracts</span>
                    <div className="text-xl font-black text-emerald-400">{allInvestments.length} Running</div>
                    <div className="text-[10px] text-slate-400">UGX Yield settling daily</div>
                  </div>
                </div>

                {/* 2. Large Action Cards (Exactly like screenshot right-side tiles) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Quick Operational Tools
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Tile 1: TOP Users */}
                    <button
                      onClick={() => setCurrentTab('manage_users')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-200" />
                        <span>TOP Users(Rank) & Balance Manager</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Tile 2: Payment Gateway Link */}
                    <button
                      onClick={() => setCurrentTab('payment_gateways')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-amber-300" />
                        <span>PAYMENT GATEWAY LINK (Lworx Pay Solutions)</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Tile 3: Edit Products & Plans */}
                    <button
                      onClick={() => setCurrentTab('plan_manage')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-emerald-300" />
                        <span>Edit Products, Images & Investment Plans</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Tile 4: Change Support Details */}
                    <button
                      onClick={() => setCurrentTab('support')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-cyan-300" />
                        <span>CHANGE Support Details (WhatsApp / Telegram)</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Tile 5: Recharge By UTR / Manual Balance Adjustment */}
                    <button
                      onClick={() => setCurrentTab('manage_users')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-amber-300" />
                        <span>RECHARGE BY UTR / Manual User Credit</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Tile 6: General Settings & Trial Bonus */}
                    <button
                      onClick={() => setCurrentTab('settings')}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#176bb8] to-[#145fa3] hover:from-[#1b79ce] hover:to-[#176bb8] text-white font-extrabold text-sm text-left flex items-center justify-between shadow-lg transition active:scale-98 group"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-indigo-300" />
                        <span>Platform Settings (Trial Bonus: UGX {trialBonusUGX.toLocaleString()})</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 2: DEPOSITS (Confirming users who have deposited)
               ------------------------------------------------------------- */}
            {currentTab === 'deposits' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">Deposit Requests & Verification</h3>
                    <p className="text-xs text-slate-400">Confirm or reject user Mobile Money recharges</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {pendingDeposits.length} Pending
                  </span>
                </div>

                {depositRequests.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-[#152a48] rounded-2xl">
                    No deposit transactions found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {depositRequests.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              {tx.accountNumber || tx.userEmail}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                tx.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Channel: <strong className="text-slate-200">{tx.method}</strong> • Ref:{' '}
                            <strong className="text-blue-300 font-mono">{tx.reference}</strong>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Time: {new Date(tx.createdAt).toLocaleString()} • User UID: {tx.userId.slice(0, 10)}...
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Amount to Credit</span>
                            <div className="text-lg font-black text-emerald-400">
                              UGX {tx.amountUGX.toLocaleString()}
                            </div>
                          </div>

                          {tx.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveDeposit(tx)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Confirm
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(tx)}
                                className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 3: WITHDRAWALS (Manual Admin Verification & Payouts)
               ------------------------------------------------------------- */}
            {currentTab === 'withdrawals' && (
              <div className="space-y-4">
                {/* Header & Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#152a48] border border-slate-700/80 rounded-2xl p-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-indigo-400" />
                      Manual Withdrawal Approvals & Payouts
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      All requested withdrawals remain on <strong className="text-amber-300">Pending</strong> until you manually verify and approve or reject them here.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        pendingWithdrawals.length > 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {pendingWithdrawals.length} Pending Approval
                    </span>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setWithdrawalFilter('pending')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      withdrawalFilter === 'pending'
                        ? 'bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Pending ({pendingWithdrawals.length})
                  </button>
                  <button
                    onClick={() => setWithdrawalFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      withdrawalFilter === 'all'
                        ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                        : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                    }`}
                  >
                    All ({withdrawalRequests.length})
                  </button>
                  <button
                    onClick={() => setWithdrawalFilter('completed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      withdrawalFilter === 'completed'
                        ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
                        : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved / Paid ({completedWithdrawals.length})
                  </button>
                  <button
                    onClick={() => setWithdrawalFilter('rejected')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      withdrawalFilter === 'rejected'
                        ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/20'
                        : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    Rejected ({rejectedWithdrawals.length})
                  </button>
                </div>

                {/* List of Withdrawals */}
                {filteredWithdrawals.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-[#152a48] rounded-2xl border border-slate-700/60">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <h4 className="font-bold text-white text-sm">No {withdrawalFilter} withdrawals found</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {withdrawalFilter === 'pending'
                        ? 'All requested user withdrawals have been processed.'
                        : 'No records in this category.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWithdrawals.map((tx) => {
                      const targetUser = allUsers.find((u) => u.uid === tx.userId);
                      const isPending = tx.status === 'pending';
                      const isCompleted = tx.status === 'completed';
                      const isRejected = tx.status === 'rejected';

                      return (
                        <div
                          key={tx.id}
                          className={`rounded-2xl p-4 transition border ${
                            isPending
                              ? 'bg-[#152a48] border-amber-500/50 shadow-lg shadow-amber-500/5'
                              : 'bg-[#12233c] border-slate-700/70'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isPending
                                      ? 'bg-amber-500 text-amber-950 animate-pulse'
                                      : isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  }`}
                                >
                                  {isPending
                                    ? '⏳ Pending Manual Approval'
                                    : isCompleted
                                    ? '✓ Approved & Paid'
                                    : '✕ Rejected & Refunded'}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  Ref: {tx.reference || tx.id.slice(0, 14)}
                                </span>
                              </div>

                              {/* Mobile Money Details & 1-click Copy */}
                              <div className="bg-[#0e1a2d] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3 max-w-md">
                                <div>
                                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                    Recipient Channel & Phone
                                  </div>
                                  <div className="text-sm font-black font-mono text-white mt-0.5 flex items-center gap-2">
                                    <span>{tx.accountNumber}</span>
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        (tx.method || '').toLowerCase().includes('mtn')
                                          ? 'bg-amber-400 text-amber-950 font-black'
                                          : 'bg-rose-600 text-white font-bold'
                                      }`}
                                    >
                                      {tx.method || 'Mobile Money'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAcc(tx.accountNumber || '')}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-bold transition flex items-center gap-1 active:scale-95"
                                  title="Copy phone number for Mobile Money payout"
                                >
                                  {copiedAcc === tx.accountNumber ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                                      <span className="text-emerald-300">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* User Info */}
                              <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                                <span>
                                  User:{' '}
                                  <strong className="text-slate-200">
                                    {tx.userName || tx.userEmail || targetUser?.displayName || 'Investor'}
                                  </strong>
                                </span>
                                {targetUser?.phone && (
                                  <span>
                                    Registered: <strong className="text-slate-300">{targetUser.phone}</strong>
                                  </span>
                                )}
                                <span>
                                  Requested:{' '}
                                  <strong className="text-slate-300">
                                    {new Date(tx.createdAt).toLocaleString()}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Right amounts & actions */}
                            <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                              <div className="bg-[#0e1a2d] px-4 py-2.5 rounded-xl border border-slate-700/60 text-right sm:min-w-[180px]">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">
                                  Net Amount to Payout
                                </div>
                                <div className="text-xl font-black text-emerald-400">
                                  UGX {(tx.netAmountUGX || tx.amountUGX).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Gross: UGX {tx.amountUGX.toLocaleString()} (Fee: {(tx.feeUGX || 0).toLocaleString()})
                                </div>
                              </div>

                              {isPending && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleApproveWithdrawal(tx)}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    Approve & Confirm
                                  </button>
                                  <button
                                    onClick={() => handleRejectWithdrawal(tx)}
                                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition active:scale-95"
                                  >
                                    Reject & Refund
                                  </button>
                                </div>
                              )}

                              {isCompleted && (
                                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Payout approved by admin
                                </span>
                              )}

                              {isRejected && (
                                <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> Rejected and refunded to user balance
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 4: MANAGE USERS & EDITING THEIR MONEY ON DASHBOARD
               ------------------------------------------------------------- */}
            {currentTab === 'manage_users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">User Accounts & Wallet Manager</h3>
                    <p className="text-xs text-slate-400">
                      Monitor user balances and adjust funds directly in Firestore
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-300">{allUsers.length} Users Registered</span>
                </div>

                <div className="space-y-3">
                  {allUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{u.displayName || 'Investor'}</span>
                          <span className="text-xs font-mono text-blue-300">({u.phone || 'No phone'})</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                            {u.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          MoMo Number: <span className="font-mono text-slate-300">{u.momoNumber || u.phone}</span> ({u.momoProvider})
                        </div>
                        <div className="text-[10px] text-slate-500">
                          UID: {u.uid} • Ref Code: <strong className="text-amber-400">{u.referralCode}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">Wallet Balance</span>
                          <div className="text-lg font-black text-emerald-400">
                            UGX {(u.balanceUGX || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Invested: UGX {(u.totalInvestedUGX || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Edit Money Button */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setBalanceDelta('0');
                            setBalanceMode('add');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Edit Money</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 5: PLAN MANAGE (Editing Products, Images & Investments)
               ------------------------------------------------------------- */}
            {currentTab === 'plan_manage' && (() => {
              const filteredAdminProducts = products.filter((p) => {
                if (!productSearchQuery.trim()) return true;
                const q = productSearchQuery.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.category.toLowerCase().includes(q) ||
                  (p.tag && p.tag.toLowerCase().includes(q)) ||
                  p.id.toLowerCase().includes(q)
                );
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">Investment Plans & Catalog</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {products.length} Packages
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Create, edit, or delete investment packages in real-time
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setResetCatalogOpen(true)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
                        title="Restore original 7 default products"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reset Defaults</span>
                      </button>
                      <button
                        onClick={openNewProduct}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                      >
                        <Plus className="w-4 h-4" /> Add New Plan
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search packages by name, tag, or category..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#152a48] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  {filteredAdminProducts.length === 0 ? (
                    <div className="p-8 text-center bg-[#152a48] rounded-2xl border border-slate-700/80 space-y-3">
                      <p className="text-sm text-slate-400">
                        {products.length === 0
                          ? 'No products currently in catalog.'
                          : 'No packages match your search filter.'}
                      </p>
                      <div className="flex justify-center gap-2">
                        {products.length === 0 ? (
                          <button
                            onClick={handleResetCatalog}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                          >
                            Restore 7 Default Packages
                          </button>
                        ) : (
                          <button
                            onClick={() => setProductSearchQuery('')}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-700 text-xs text-white font-bold"
                          >
                            Clear Search Filter
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredAdminProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-4 flex gap-3.5 items-center justify-between hover:border-slate-600 transition"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 group/img">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500">
                                  <ImageIcon className="w-5 h-5 mb-0.5" />
                                  <span className="text-[8px] font-bold">No Image</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setQuickImageProduct({ ...prod })}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center text-[9px] text-white font-bold"
                                title="Change or remove product image"
                              >
                                <ImageIcon className="w-3.5 h-3.5 mb-0.5 text-blue-400" />
                                <span>Image</span>
                              </button>
                            </div>

                            <div className="space-y-0.5 truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                                  {prod.tag || prod.category}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]">
                                  {prod.id}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-sm text-white truncate">{prod.name}</h4>
                              <div className="text-xs text-slate-300">
                                Share: <strong className="text-blue-300">UGX {prod.shareValueUGX.toLocaleString()}</strong>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-bold">
                                Yield: +UGX {prod.dailyReturnUGX.toLocaleString()} / day ({prod.contractDays} days)
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => setQuickImageProduct({ ...prod })}
                              className="p-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white transition flex items-center justify-center shadow-xs"
                              title="Edit / Remove Image"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditProduct(prod)}
                              className="p-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white transition flex items-center justify-center shadow-xs"
                              title="Edit Plan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition flex items-center justify-center shadow-xs"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* -------------------------------------------------------------
                TAB 6b: BANNERS & MEDIA (HERO SLIDES & PROMOTIONS)
               ------------------------------------------------------------- */}
            {currentTab === 'banners_media' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">Homepage Banners & Hero Media</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {currentBanners.length} Slides
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Upload promotional banners from phone/device, change headlines, or remove recent promotional images
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetBanners}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
                      title="Restore original 3 default banner slides"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Defaults</span>
                    </button>
                    <button
                      onClick={openNewBanner}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Add Banner Slide
                    </button>
                  </div>
                </div>

                {currentBanners.length === 0 ? (
                  <div className="p-8 text-center bg-[#152a48] rounded-2xl border border-slate-700/80 space-y-3">
                    <p className="text-sm text-slate-400">
                      No banner slides currently active on homepage.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleResetBanners}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Restore Default Banners
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentBanners.map((banner, index) => (
                      <div
                        key={banner.id || index}
                        className="bg-[#152a48] border border-slate-700/80 rounded-2xl overflow-hidden hover:border-slate-600 transition flex flex-col justify-between shadow-lg"
                      >
                        <div className="relative h-36 bg-slate-950 overflow-hidden group">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-amber-950">
                              {banner.badge || 'Slide ' + (index + 1)}
                            </span>
                            <span className="text-[10px] text-white/80 font-mono bg-black/50 px-1.5 py-0.5 rounded-md">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-3 right-3">
                            <h4 className="font-extrabold text-sm text-white line-clamp-1 drop-shadow-md">
                              {banner.title}
                            </h4>
                            {banner.subtitle && (
                              <p className="text-[11px] text-slate-300 line-clamp-1 drop-shadow-xs">
                                {banner.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-[#11223b] border-t border-slate-800 flex items-center justify-between">
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                            {banner.id}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsNewBanner(false);
                                setEditingBanner({ ...banner });
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
                              title="Edit Banner & Image"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setBannerToDelete(banner)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
                              title="Remove Banner Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 7: PAYMENT GATEWAYS & WITHDRAWAL LINKS
               ------------------------------------------------------------- */}
            {currentTab === 'payment_gateways' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <h3 className="text-lg font-black text-white">Payment Gateway & Withdrawal Channels</h3>
                  <p className="text-xs text-slate-400">
                    Configure official payment checkout link (Lworx Pay Solutions) and automated withdrawal endpoints
                  </p>
                </div>

                <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-5 space-y-4">
                  {/* Payment Gateway Link */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Official Lworx Pay Solutions Link:
                      </label>
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-300 hover:text-blue-200 flex items-center gap-1 font-bold underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link ↗
                      </a>
                    </div>
                    <input
                      type="url"
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      placeholder="https://lworxpaysolutions.com/pay/royco-mix-investment"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Users clicking "Deposit" will pay securely through this checkout link.
                    </p>
                  </div>

                  {/* Withdrawal Endpoint Link */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Withdrawal Payout Gateway Link:
                    </label>
                    <input
                      type="text"
                      value={withdrawLink}
                      onChange={(e) => setWithdrawLink(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Automated payout processing endpoint for user withdrawals.
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      await updateSettings({ paymentLink, withdrawLink });
                      showNotification('success', 'Payment gateway configurations saved to Firestore!');
                    }}
                    className="w-full py-3 rounded-xl bg-[#1764c4] hover:bg-[#1353a3] text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Save Gateway Settings
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 7: INVESTMENT REPORT
               ------------------------------------------------------------- */}
            {currentTab === 'investment_report' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white">Platform Investment Report</h3>
                  <p className="text-xs text-slate-400">Total contracts purchased across all members</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#152a48] p-4 rounded-2xl border border-slate-700">
                    <span className="text-[10px] text-slate-400">Total Capital Committed</span>
                    <div className="text-xl font-black text-blue-400 mt-1">
                      UGX{' '}
                      {allInvestments
                        .reduce((acc, i) => acc + (i.shareValueUGX || 0), 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#152a48] p-4 rounded-2xl border border-slate-700">
                    <span className="text-[10px] text-slate-400">Total Yield Settled</span>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      UGX{' '}
                      {allInvestments
                        .reduce((acc, i) => acc + (i.claimedReturnUGX || 0), 0)
                        .toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#152a48] p-4 rounded-2xl border border-slate-700">
                    <span className="text-[10px] text-slate-400">Total Contracts</span>
                    <div className="text-xl font-black text-white mt-1">{allInvestments.length} Active</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {allInvestments.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{inv.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          User ID: {inv.userId} • Purchased: {new Date(inv.purchasedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-400">
                          +UGX {inv.dailyReturnUGX.toLocaleString()} / day
                        </div>
                        <span className="text-[10px] text-blue-300">
                          Progress: Day {inv.daysElapsed} of {inv.contractDays}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 8: SUPPORT DETAILS
               ------------------------------------------------------------- */}
            {currentTab === 'support' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <h3 className="text-lg font-black text-white">Customer Support Configuration</h3>
                  <p className="text-xs text-slate-400">Update official WhatsApp and Telegram channels</p>
                </div>

                <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      WhatsApp Support Number / Link:
                    </label>
                    <input
                      type="text"
                      value={whatsappLink}
                      onChange={(e) => setWhatsappLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Telegram Official Channel:
                    </label>
                    <input
                      type="text"
                      value={telegramLink}
                      onChange={(e) => setTelegramLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      await updateSettings({ whatsapp: whatsappLink, telegram: telegramLink });
                      showNotification('success', 'Support channels updated and saved!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Save Support Contacts
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                TAB 9: SETTINGS
               ------------------------------------------------------------- */}
            {currentTab === 'settings' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <h3 className="text-lg font-black text-white">General System Settings</h3>
                  <p className="text-xs text-slate-400">Adjust signup bonus, minimum limits, and fee policies</p>
                </div>

                <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      New Member Signup Trial Bonus (UGX):
                    </label>
                    <input
                      type="number"
                      value={trialBonusUGX}
                      onChange={(e) => setTrialBonusUGX(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-base"
                    />
                  </div>

                  <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl text-xs text-blue-200">
                    Currently set to <strong className="text-white">UGX {trialBonusUGX.toLocaleString()}</strong>.
                    Every user registering receives this balance instantly.
                  </div>

                  <button
                    onClick={async () => {
                      await updateSettings({ trialBonusUGX });
                      showNotification('success', 'System settings saved to Firestore!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#1764c4] hover:bg-[#1353a3] text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Save System Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            MODAL: EDIT USER BALANCE / MONEY (MONITORING & ADJUSTING ON DASHBOARD)
           ========================================================================= */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-[#152a48] border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <h3 className="font-extrabold text-sm">Adjust User Money</h3>
                  <p className="text-xs text-slate-400">{editingUser.phone} ({editingUser.displayName})</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">Current Balance:</span>
                <span className="font-black text-emerald-400 text-base">
                  UGX {(editingUser.balanceUGX || 0).toLocaleString()}
                </span>
              </div>

              <form onSubmit={handleSaveUserBalance} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Adjustment Action:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBalanceMode('add')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        balanceMode === 'add'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      + Add Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceMode('subtract')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        balanceMode === 'subtract'
                          ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      - Deduct
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceMode('set')}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        balanceMode === 'set'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      = Set Exact
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Amount (UGX):
                  </label>
                  <input
                    type="number"
                    value={balanceDelta}
                    onChange={(e) => setBalanceDelta(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter UGX amount"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition active:scale-95"
                >
                  Save & Sync Balance in Firestore
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: EDIT PRODUCT / PLAN (IMAGES, SHARE VALUE, DAILY YIELD, DURATION)
           ========================================================================= */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div>
                  <h3 className="font-extrabold text-base">
                    {isNewProduct ? 'Create New Plan' : 'Edit Investment Plan'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{editingProduct.id}</p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Product Name:</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. ROYCO MIX COMMERCIAL SEASONING"
                    required
                  />
                </div>

                <div>
                  <ImageUploadManager
                    imageUrl={editingProduct.imageUrl || ''}
                    onChange={(newUrl) => setEditingProduct({ ...editingProduct, imageUrl: newUrl })}
                    onRemove={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                    label="Equipment Photo / Package Image"
                    helperText="Upload image from phone or computer, select a Royco preset, or paste a URL."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Share Value (UGX):</label>
                    <input
                      type="number"
                      value={editingProduct.shareValueUGX}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, shareValueUGX: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                      min="1000"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Daily Return (UGX):</label>
                    <input
                      type="number"
                      value={editingProduct.dailyReturnUGX}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          dailyReturnUGX: Number(e.target.value),
                          totalReturnUGX: Number(e.target.value) * (editingProduct.contractDays || 1),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Contract Duration (Days):</label>
                    <input
                      type="number"
                      value={editingProduct.contractDays}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          contractDays: Number(e.target.value),
                          totalReturnUGX: (editingProduct.dailyReturnUGX || 0) * Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Purchase Limit Per User:</label>
                    <input
                      type="number"
                      value={editingProduct.limitPerUser}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, limitPerUser: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>

                {/* Total Payout Summary Preview */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Calculated Total ROI</span>
                    <strong className="text-emerald-400 font-extrabold text-sm">
                      UGX {((editingProduct.dailyReturnUGX || 0) * (editingProduct.contractDays || 1)).toLocaleString()}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Contract Multiplier</span>
                    <strong className="text-blue-300 font-bold">
                      {editingProduct.shareValueUGX > 0
                        ? `${Math.round(
                            (((editingProduct.dailyReturnUGX || 0) * (editingProduct.contractDays || 1)) /
                              editingProduct.shareValueUGX) *
                              100
                          )}%`
                        : '0%'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Category:</label>
                    <input
                      type="text"
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
                      placeholder="e.g. Processing Unit"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tag Badge:</label>
                    <input
                      type="text"
                      value={editingProduct.tag || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
                      placeholder="e.g. Hot, VIP 1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Description:</label>
                  <textarea
                    value={productDescriptionText}
                    onChange={(e) => setProductDescriptionText(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500 resize-none"
                    placeholder="Short summary of this production machine or contract..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Key Highlights (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={productHighlightsText}
                    onChange={(e) => setProductHighlightsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Fast ROI, Daily Yield, Instant Payout"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {!isNewProduct && (
                    <button
                      type="button"
                      onClick={() => setProductToDelete(editingProduct)}
                      className="py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    {isNewProduct ? 'Create Investment Package' : 'Save Package Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFIRM PRODUCT DELETION
           ========================================================================= */}
        {productToDelete && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-rose-500/50 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Delete Investment Package?</h3>
                  <p className="text-[11px] text-slate-400">Permanent removal from catalog</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-1">
                <div className="font-extrabold text-xs text-white line-clamp-1">{productToDelete.name}</div>
                <div className="text-[11px] text-slate-400">
                  ID: <span className="font-mono text-slate-300">{productToDelete.id}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  UGX {productToDelete.shareValueUGX.toLocaleString()} • Yield: UGX {productToDelete.dailyReturnUGX.toLocaleString()}/day
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete this package? It will be removed immediately from both Firestore and the investor catalog.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFIRM RESET TO DEFAULT 7 PACKAGES
           ========================================================================= */}
        {resetCatalogOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-amber-500/50 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Reset Catalog to Defaults?</h3>
                  <p className="text-[11px] text-slate-400">Restore 7 original packages</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This will overwrite your product catalog with the original 7 Royco Mix investment plans (Trial Experience, Pocket Blend, Portable Mini, Aroma Extractor, Commercial Seasoning, Cube Line, and Regional Agri-Plant) and sync them to Firestore.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetCatalogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition active:scale-95"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: QUICK PRODUCT IMAGE EDIT & REMOVAL
           ========================================================================= */}
        {quickImageProduct && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-purple-500/40 rounded-3xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Edit Package Image</h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                      {quickImageProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuickImageProduct(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ImageUploadManager
                imageUrl={quickImageProduct.imageUrl || ''}
                onChange={(newUrl) => setQuickImageProduct({ ...quickImageProduct, imageUrl: newUrl })}
                onRemove={() => setQuickImageProduct({ ...quickImageProduct, imageUrl: '' })}
                label="Product Photo"
                helperText="Upload a photo from your phone/computer, select a preset, or clear this image."
              />

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuickImageProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickImage}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Save Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: EDIT OR ADD HOMEPAGE BANNER SLIDE
           ========================================================================= */}
        {editingBanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-amber-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      {isNewBanner ? 'Add New Homepage Banner' : 'Edit Homepage Banner'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">{editingBanner.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingBanner(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Banner Headline / Title:</label>
                  <input
                    type="text"
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Royco Mix Agro Production Line"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Subtitle / Marketing Pitch:</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Daily automated returns directly to Airtel & MTN Mobile Money"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Badge Tag:</label>
                  <input
                    type="text"
                    value={editingBanner.badge || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-blue-500"
                    placeholder="e.g. Hot Offer, VIP 1, Official Plant"
                  />
                </div>

                <ImageUploadManager
                  imageUrl={editingBanner.imageUrl || ''}
                  onChange={(newUrl) => setEditingBanner({ ...editingBanner, imageUrl: newUrl })}
                  onRemove={() => setEditingBanner({ ...editingBanner, imageUrl: '' })}
                  label="Banner Background Image"
                  helperText="Upload a high-res photo from phone or desktop, or pick a preset."
                />

                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition active:scale-95"
                  >
                    {isNewBanner ? 'Add Banner Slide' : 'Save Banner Slide'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFIRM BANNER REMOVAL
           ========================================================================= */}
        {bannerToDelete && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-rose-500/50 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Remove Banner Slide?</h3>
                  <p className="text-[11px] text-slate-400">Remove from homepage</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">"{bannerToDelete.title}"</strong> from the homepage banner carousel?
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBannerToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveBanner(bannerToDelete.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
