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
  GiftCode,
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
  Gift,
  Ticket,
  Palette,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageUploadManager } from './ImageUploadManager';
import { BannerSlide, DEFAULT_BANNERS, ThemeColorOption, DefaultThemeMode } from '../../context/ProductsContext';

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
  | 'gift_codes'
  | 'plan_manage'
  | 'banners_media'
  | 'payment_gateways'
  | 'support'
  | 'settings'
  | 'theme_colors';


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
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [banPromptUser, setBanPromptUser] = useState<UserProfile | null>(null);
  const [banReasonText, setBanReasonText] = useState('Violation of platform policy');

  // Gift Codes management state
  const [allGiftCodes, setAllGiftCodes] = useState<GiftCode[]>([]);
  const [giftSearchQuery, setGiftSearchQuery] = useState('');
  const [giftFilter, setGiftFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [isNewGiftModalOpen, setIsNewGiftModalOpen] = useState(false);
  const [giftCodeToDelete, setGiftCodeToDelete] = useState<GiftCode | null>(null);
  const [viewingGiftUsers, setViewingGiftUsers] = useState<GiftCode | null>(null);
  const [copiedGiftCode, setCopiedGiftCode] = useState<string | null>(null);

  // Form state for creating a new gift code
  const [newGiftCode, setNewGiftCode] = useState('');
  const [newGiftAmount, setNewGiftAmount] = useState<number | ''>('');
  const [newGiftMaxUses, setNewGiftMaxUses] = useState<number | ''>(50);
  const [newGiftNote, setNewGiftNote] = useState('');
  const [isSubmittingGift, setIsSubmittingGift] = useState(false);

  // Settings State initialized from dynamic settings
  const [paymentLink, setPaymentLink] = useState(
    settings.paymentLink || 'https://lworxpaysolutions.com/pay/royco-mix-investment'
  );
  const [withdrawLink, setWithdrawLink] = useState(settings.withdrawLink || 'https://momo.ug/payout/royco');
  const [whatsappLink, setWhatsappLink] = useState(settings.whatsapp || '+256770000000');
  const [telegramLink, setTelegramLink] = useState(settings.telegram || 'https://t.me/roycomix_ug');
  const [trialBonusUGX, setTrialBonusUGX] = useState(settings.trialBonusUGX || 3000);
  const [selectedThemeColor, setSelectedThemeColor] = useState<ThemeColorOption>(
    settings.themeColor || 'blue'
  );
  const [selectedDefaultMode, setSelectedDefaultMode] = useState<DefaultThemeMode>(
    settings.defaultThemeMode || 'system'
  );

  // Sync settings when updated
  useEffect(() => {
    if (settings) {
      if (settings.paymentLink) setPaymentLink(settings.paymentLink);
      setWithdrawLink(settings.withdrawLink);
      setWhatsappLink(settings.whatsapp);
      setTelegramLink(settings.telegram);
      setTrialBonusUGX(settings.trialBonusUGX);
      if (settings.themeColor) setSelectedThemeColor(settings.themeColor);
      if (settings.defaultThemeMode) setSelectedDefaultMode(settings.defaultThemeMode);
    }
  }, [settings]);

  // Modals inside Admin
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [balanceDelta, setBalanceDelta] = useState<string>('');
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

  // 1. Listen for all users, transactions, investments & gift codes
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

    const unsubGift = onSnapshot(
      collection(db, 'giftCodes'),
      (snapshot) => {
        const codes = snapshot.docs.map((docSnap) => docSnap.data() as GiftCode);
        codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllGiftCodes(codes);
      },
      (err) => {
        console.warn('Admin gift codes fetch note:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubTx();
      unsubInv();
      unsubGift();
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
      setBalanceDelta('');
      showNotification('success', `Updated user balance to UGX ${newBalance.toLocaleString()}`);
    } catch (err) {
      showNotification('error', 'Failed to update user balance');
    }
  };

  // 4. Ban and Unban User Accounts
  const handleBanUser = async (target: UserProfile, reason?: string) => {
    try {
      const now = new Date().toISOString();
      const banReason = reason || banReasonText || 'Violation of platform policy';

      await updateDoc(doc(db, 'users', target.uid), {
        isBanned: true,
        banReason,
        bannedAt: now,
        updatedAt: now,
      });

      setAllUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid
            ? { ...u, isBanned: true, banReason, bannedAt: now, updatedAt: now }
            : u
        )
      );

      if (editingUser?.uid === target.uid) {
        setEditingUser((prev) => (prev ? { ...prev, isBanned: true, banReason, bannedAt: now } : null));
      }

      setBanPromptUser(null);
      showNotification('success', `User account ${target.phone || target.displayName || target.uid} is now BANNED.`);
    } catch (err) {
      showNotification('error', 'Failed to ban user account');
    }
  };

  const handleUnbanUser = async (target: UserProfile) => {
    try {
      const now = new Date().toISOString();

      await updateDoc(doc(db, 'users', target.uid), {
        isBanned: false,
        banReason: '',
        bannedAt: '',
        updatedAt: now,
      });

      setAllUsers((prev) =>
        prev.map((u) =>
          u.uid === target.uid
            ? { ...u, isBanned: false, banReason: '', bannedAt: undefined, updatedAt: now }
            : u
        )
      );

      if (editingUser?.uid === target.uid) {
        setEditingUser((prev) => (prev ? { ...prev, isBanned: false, banReason: '' } : null));
      }

      confetti({ particleCount: 40, spread: 50 });
      showNotification('success', `User account ${target.phone || target.displayName || target.uid} has been UNBANNED.`);
    } catch (err) {
      showNotification('error', 'Failed to unban user account');
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

  // Gift Codes Management Handlers
  const handleCopyGiftCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedGiftCode(code);
    setTimeout(() => setCopiedGiftCode(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewGiftCode(`ROYCO-${rand}`);
  };

  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newGiftCode.trim().toUpperCase();
    const numAmount = typeof newGiftAmount === 'number' ? newGiftAmount : Number(newGiftAmount) || 0;
    const numMaxUses = typeof newGiftMaxUses === 'number' ? newGiftMaxUses : Number(newGiftMaxUses) || 1;

    if (!clean) {
      showNotification('error', 'Please enter a code name or click generate.');
      return;
    }
    if (numAmount <= 0) {
      showNotification('error', 'Please enter a valid reward amount in UGX.');
      return;
    }

    setIsSubmittingGift(true);
    try {
      const now = new Date().toISOString();
      const codeItem: GiftCode = {
        id: clean,
        code: clean,
        amountUGX: numAmount,
        maxUses: numMaxUses,
        usedCount: 0,
        usedByUserIds: [],
        status: 'active',
        note: newGiftNote.trim() || undefined,
        createdAt: now,
        createdBy: user?.email || 'Admin',
      };

      await setDoc(doc(db, 'giftCodes', clean), codeItem);
      showNotification('success', `Gift Code "${clean}" created for UGX ${numAmount.toLocaleString()}!`);
      setIsNewGiftModalOpen(false);
      setNewGiftCode('');
      setNewGiftAmount('');
      setNewGiftMaxUses(50);
      setNewGiftNote('');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to create gift code in Firestore.');
    } finally {
      setIsSubmittingGift(false);
    }
  };

  const handleToggleGiftStatus = async (item: GiftCode) => {
    const nextStatus = item.status === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(db, 'giftCodes', item.id || item.code), {
        status: nextStatus,
      });
      showNotification('success', `Gift code ${item.code} is now ${nextStatus}.`);
    } catch {
      showNotification('error', 'Failed to update code status.');
    }
  };

  const handleDeleteGiftCode = async (item: GiftCode) => {
    try {
      await deleteDoc(doc(db, 'giftCodes', item.id || item.code));
      showNotification('success', `Gift code ${item.code} deleted permanently.`);
      setGiftCodeToDelete(null);
    } catch {
      showNotification('error', 'Failed to delete gift code.');
    }
  };

  const handleSeedInitialCodes = async () => {
    try {
      const initial: GiftCode[] = [
        {
          id: 'ROYCO2026',
          code: 'ROYCO2026',
          amountUGX: 5000,
          maxUses: 500,
          usedCount: 0,
          usedByUserIds: [],
          status: 'active',
          note: 'Official Launch Bonus Voucher',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        },
        {
          id: 'ROYCOVIP',
          code: 'ROYCOVIP',
          amountUGX: 10000,
          maxUses: 100,
          usedCount: 0,
          usedByUserIds: [],
          status: 'active',
          note: 'VIP Special Investor Reward',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
        },
      ];
      for (const item of initial) {
        await setDoc(doc(db, 'giftCodes', item.code), item);
      }
      showNotification('success', 'Default gift codes seeded in Firestore!');
    } catch (e) {
      showNotification('error', 'Could not seed gift codes');
    }
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
              <img
                src="/assets/aistudio/file_00000000784c81f4b55dedd74b2223f9_6a04b5cc.png"
                alt="Royco Admin"
                className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0 border border-white/20"
              />
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

            {/* 5b. Gift Codes (Vouchers & Reward Codes) */}
            <button
              onClick={() => setCurrentTab('gift_codes')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                currentTab === 'gift_codes'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Gift className="w-4 h-4 shrink-0 text-pink-300" />
                {sidebarOpen && <span>Gift Codes</span>}
              </div>
              {sidebarOpen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                  {allGiftCodes.length}
                </span>
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

            {/* 10. Theme & Brand Colors */}
            <button
              onClick={() => setCurrentTab('theme_colors')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                currentTab === 'theme_colors'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0 text-pink-300" />
              {sidebarOpen && <span>Theme & Colors</span>}
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
            {currentTab === 'manage_users' && (() => {
              const activeUsersCount = allUsers.filter((u) => !u.isBanned).length;
              const bannedUsersCount = allUsers.filter((u) => u.isBanned).length;

              const filteredUsers = allUsers.filter((u) => {
                if (userFilter === 'banned' && !u.isBanned) return false;
                if (userFilter === 'active' && u.isBanned) return false;
                if (!userSearchQuery.trim()) return true;
                const q = userSearchQuery.toLowerCase();
                return (
                  (u.phone && u.phone.toLowerCase().includes(q)) ||
                  (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                  (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
                  (u.momoNumber && u.momoNumber.toLowerCase().includes(q)) ||
                  (u.uid && u.uid.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#152a48] border border-slate-700/80 rounded-2xl p-4">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        User Accounts & Access Control
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Manage user wallet balances and ban or unban accounts in real time.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {allUsers.length} Users Total
                      </span>
                      {bannedUsersCount > 0 && (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {bannedUsersCount} Banned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          userFilter === 'all'
                            ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        All ({allUsers.length})
                      </button>
                      <button
                        onClick={() => setUserFilter('active')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          userFilter === 'active'
                            ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        Active ({activeUsersCount})
                      </button>
                      <button
                        onClick={() => setUserFilter('banned')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          userFilter === 'banned'
                            ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Banned ({bannedUsersCount})
                      </button>
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search phone, name, UID..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#152a48] border border-slate-700/80 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-[#152a48] rounded-2xl border border-slate-700/60">
                      No matching user accounts found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers.map((u) => (
                        <div
                          key={u.uid}
                          className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition ${
                            u.isBanned
                              ? 'bg-[#1c1829] border-rose-500/40 shadow-sm'
                              : 'bg-[#152a48] border-slate-700/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white text-sm">{u.displayName || 'Investor'}</span>
                              <span className="text-xs font-mono text-blue-300">({u.phone || 'No phone'})</span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                                {u.role}
                              </span>
                              {u.isBanned ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> BANNED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              MoMo: <span className="font-mono text-slate-300">{u.momoNumber || u.phone || 'Not set'}</span> ({u.momoProvider || 'MTN MoMo'})
                            </div>
                            <div className="text-[10px] text-slate-500">
                              UID: {u.uid} • Ref Code: <strong className="text-amber-400">{u.referralCode}</strong>
                            </div>
                            {u.isBanned && (
                              <div className="text-xs text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/40 inline-block">
                                Reason: <strong>{u.banReason || 'Policy Violation'}</strong>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400">Wallet Balance</span>
                              <div className="text-lg font-black text-emerald-400">
                                UGX {(u.balanceUGX || 0).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Invested: UGX {(u.totalInvestedUGX || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Ban / Unban Button */}
                              {u.isBanned ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnbanUser(u)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition active:scale-95 shadow-md flex items-center gap-1.5"
                                  title="Restore user account to active status"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Unban</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBanPromptUser(u);
                                    setBanReasonText('Violation of platform policy');
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-xs border border-rose-500/40 transition active:scale-95 flex items-center gap-1.5"
                                  title="Suspend user account"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Ban</span>
                                </button>
                              )}

                              {/* Edit Money Button */}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setBalanceDelta('');
                                  setBalanceMode('add');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1.5"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Edit Money</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* -------------------------------------------------------------
                TAB 5b: GIFT CODES (Vouchers & Reward Codes)
               ------------------------------------------------------------- */}
            {currentTab === 'gift_codes' && (() => {
              const activeCount = allGiftCodes.filter((g) => g.status === 'active').length;
              const disabledCount = allGiftCodes.filter((g) => g.status === 'disabled').length;
              const expiredCount = allGiftCodes.filter((g) => g.status === 'expired').length;

              const totalRedeemedCount = allGiftCodes.reduce((sum, g) => sum + (g.usedCount || 0), 0);
              const totalAmountPaidOut = allGiftCodes.reduce(
                (sum, g) => sum + (g.usedCount || 0) * (g.amountUGX || 0),
                0
              );

              const filteredCodes = allGiftCodes.filter((item) => {
                if (giftFilter !== 'all' && item.status !== giftFilter) return false;
                if (!giftSearchQuery.trim()) return true;
                const q = giftSearchQuery.toLowerCase();
                return (
                  item.code.toLowerCase().includes(q) ||
                  (item.note && item.note.toLowerCase().includes(q))
                );
              });

              return (
                <div className="space-y-4">
                  {/* Top Bar with Title & Create Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          <Gift className="w-5 h-5 text-pink-400" />
                          <span>Gift Codes & Vouchers</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          {allGiftCodes.length} Codes
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Create instant cash voucher codes for users with custom reward amounts and limits
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {allGiftCodes.length === 0 && (
                        <button
                          type="button"
                          onClick={handleSeedInitialCodes}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Seed Sample Codes</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNewGiftCode('');
                          setNewGiftAmount('');
                          setNewGiftMaxUses(50);
                          setNewGiftNote('');
                          setIsNewGiftModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-pink-600/25"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Gift Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Total Codes
                      </span>
                      <div className="text-xl font-black text-white">{allGiftCodes.length}</div>
                      <span className="text-[10px] text-pink-300">
                        {activeCount} active in catalog
                      </span>
                    </div>

                    <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Total Distributed
                      </span>
                      <div className="text-xl font-black text-emerald-400">
                        UGX {totalAmountPaidOut.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">Total credited to wallets</span>
                    </div>

                    <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Times Redeemed
                      </span>
                      <div className="text-xl font-black text-amber-400">
                        {totalRedeemedCount}
                      </div>
                      <span className="text-[10px] text-slate-400">Successful user claims</span>
                    </div>

                    <div className="bg-[#152a48] border border-slate-700/80 rounded-2xl p-3 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Status Breakdown
                      </span>
                      <div className="text-xs font-bold space-y-0.5 text-slate-300 pt-0.5">
                        <div className="text-emerald-400">✓ {activeCount} Active</div>
                        <div className="text-rose-400">✕ {disabledCount} Paused</div>
                        <div className="text-slate-400">⏳ {expiredCount} Expired</div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setGiftFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          giftFilter === 'all'
                            ? 'bg-pink-600 text-white font-black shadow-md shadow-pink-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        All ({allGiftCodes.length})
                      </button>
                      <button
                        onClick={() => setGiftFilter('active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          giftFilter === 'active'
                            ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        Active ({activeCount})
                      </button>
                      <button
                        onClick={() => setGiftFilter('disabled')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          giftFilter === 'disabled'
                            ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/20'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        Disabled ({disabledCount})
                      </button>
                      <button
                        onClick={() => setGiftFilter('expired')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          giftFilter === 'expired'
                            ? 'bg-slate-700 text-white font-black'
                            : 'bg-[#152a48] text-slate-300 hover:bg-[#1a3356]'
                        }`}
                      >
                        Expired ({expiredCount})
                      </button>
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={giftSearchQuery}
                        onChange={(e) => setGiftSearchQuery(e.target.value)}
                        placeholder="Search gift codes or notes..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#152a48] border border-slate-700/80 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  {/* List / Cards */}
                  {filteredCodes.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-[#152a48] rounded-2xl border border-slate-700/60 space-y-3">
                      <Gift className="w-10 h-10 mx-auto text-slate-600" />
                      <div>
                        <div className="font-bold text-white text-sm">No Gift Codes Found</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Create a gift code above to give users custom cash rewards when they redeem in the Bonus Task Center.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewGiftCode('');
                          setNewGiftAmount('');
                          setNewGiftMaxUses(50);
                          setNewGiftNote('');
                          setIsNewGiftModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-500 transition"
                      >
                        + Create First Gift Code
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredCodes.map((item) => {
                        const pctUsed = item.maxUses && item.maxUses > 0
                          ? Math.min(100, Math.round(((item.usedCount || 0) / item.maxUses) * 100))
                          : 0;

                        return (
                          <div
                            key={item.id || item.code}
                            className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 transition shadow-sm ${
                              item.status === 'active'
                                ? 'bg-[#152a48] border-pink-500/30'
                                : item.status === 'disabled'
                                ? 'bg-[#1a1c29] border-rose-500/30'
                                : 'bg-[#141d2c] border-slate-700/60 opacity-80'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Header: Code & Status */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-base text-pink-300 tracking-wider bg-pink-950/60 px-2.5 py-1 rounded-xl border border-pink-500/30">
                                    {item.code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyGiftCode(item.code)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
                                    title="Copy Gift Code"
                                  >
                                    {copiedGiftCode === item.code ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    item.status === 'active'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : item.status === 'disabled'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              {/* Amount Display */}
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Reward Amount</span>
                                  <div className="text-xl font-black text-emerald-400">
                                    UGX {item.amountUGX.toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Redeemed</span>
                                  <div className="text-xs font-mono font-bold text-white">
                                    {item.usedCount || 0} / {item.maxUses ? item.maxUses : '∞'} users
                                  </div>
                                </div>
                              </div>

                              {/* Usage Progress Bar */}
                              {item.maxUses > 0 && (
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        pctUsed >= 100
                                          ? 'bg-rose-500'
                                          : pctUsed > 70
                                          ? 'bg-amber-400'
                                          : 'bg-gradient-to-r from-pink-500 to-emerald-400'
                                      }`}
                                      style={{ width: `${pctUsed}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                    <span>{pctUsed}% claimed</span>
                                    <span>{Math.max(0, item.maxUses - (item.usedCount || 0))} slots remaining</span>
                                  </div>
                                </div>
                              )}

                              {item.note && (
                                <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-700/60">
                                  💬 <span className="font-semibold">{item.note}</span>
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setViewingGiftUsers(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                <span>Users ({item.usedByUserIds?.length || 0})</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleGiftStatus(item)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                                    item.status === 'active'
                                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  }`}
                                >
                                  {item.status === 'active' ? 'Pause' : 'Activate'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setGiftCodeToDelete(item)}
                                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                                  title="Delete Code"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

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

            {/* -------------------------------------------------------------
                TAB 10: THEME & BRAND COLORS
               ------------------------------------------------------------- */}
            {currentTab === 'theme_colors' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <div className="flex items-center gap-2 text-pink-400 mb-1">
                    <Palette className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider">Appearance Control</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Platform Color Scheme & Default Theme</h3>
                  <p className="text-xs text-slate-400">
                    Set the primary brand color palette and default appearance mode for all user interfaces across the platform.
                  </p>
                </div>

                {/* 1. Master Brand Color Selector */}
                <div className="bg-[#152a48] border border-slate-700/80 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Brand Color Palette</h4>
                      <p className="text-[11px] text-slate-400">Select the accent color displayed to all users</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                      Active: {selectedThemeColor.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'blue' as ThemeColorOption,
                        name: 'Royco Blue',
                        desc: 'Classic original brand',
                        hex: '#1764c4',
                        gradient: 'from-[#1764c4] to-[#0c3d7c]',
                        ring: 'ring-blue-500',
                      },
                      {
                        id: 'emerald' as ThemeColorOption,
                        name: 'Emerald Mint',
                        desc: 'Agri-yield & growth',
                        hex: '#059669',
                        gradient: 'from-emerald-600 to-teal-800',
                        ring: 'ring-emerald-500',
                      },
                      {
                        id: 'purple' as ThemeColorOption,
                        name: 'Royal Purple',
                        desc: 'High-tier VIP prestige',
                        hex: '#7c3aed',
                        gradient: 'from-purple-600 to-indigo-800',
                        ring: 'ring-purple-500',
                      },
                      {
                        id: 'amber' as ThemeColorOption,
                        name: 'Harvest Gold',
                        desc: 'Warm sunshine amber',
                        hex: '#d97706',
                        gradient: 'from-amber-600 to-orange-800',
                        ring: 'ring-amber-500',
                      },
                      {
                        id: 'rose' as ThemeColorOption,
                        name: 'Ruby Rose',
                        desc: 'High-energy crimson',
                        hex: '#e11d48',
                        gradient: 'from-rose-600 to-pink-800',
                        ring: 'ring-rose-500',
                      },
                      {
                        id: 'cyan' as ThemeColorOption,
                        name: 'Electric Cyan',
                        desc: 'Modern turquoise fintech',
                        hex: '#0891b2',
                        gradient: 'from-cyan-600 to-blue-800',
                        ring: 'ring-cyan-500',
                      },
                    ].map((palette) => {
                      const isSelected = selectedThemeColor === palette.id;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => setSelectedThemeColor(palette.id)}
                          className={`p-3.5 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden group ${
                            isSelected
                              ? `bg-slate-900 border-white/40 ring-2 ${palette.ring} shadow-lg shadow-black/40`
                              : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900/90 hover:border-slate-600'
                          }`}
                        >
                          {/* Accent Gradient Band */}
                          <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${palette.gradient} mb-2.5 w-full shadow-xs`}
                          />

                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-extrabold text-xs text-white group-hover:text-white">
                              {palette.name}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-black">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{palette.desc}</p>
                          <div className="mt-2 text-[9px] font-mono font-bold text-slate-500 flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: palette.hex }}
                            />
                            <span>{palette.hex}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Platform Default Mode (Light vs Dark) */}
                <div className="bg-[#152a48] border border-slate-700/80 rounded-3xl p-5 space-y-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Default Theme Mode for Users</h4>
                    <p className="text-[11px] text-slate-400">
                      Choose what appearance new visitors and unregistered users see first (users can switch anytime).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'system' as DefaultThemeMode,
                        label: 'Auto / System',
                        desc: 'Matches user phone OS setting',
                        icon: Laptop,
                      },
                      {
                        id: 'light' as DefaultThemeMode,
                        label: 'Light Theme',
                        desc: 'Crisp bright white & clean slate',
                        icon: Sun,
                      },
                      {
                        id: 'dark' as DefaultThemeMode,
                        label: 'Dark Theme',
                        desc: 'Deep navy night mode contrast',
                        icon: Moon,
                      },
                    ].map((mode) => {
                      const isSelected = selectedDefaultMode === mode.id;
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedDefaultMode(mode.id)}
                          className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-900 border-indigo-400 ring-2 ring-indigo-500/50 shadow-md'
                              : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900/90 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`p-2 rounded-xl ${
                                isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-white mb-0.5">{mode.label}</div>
                            <div className="text-[10px] text-slate-400">{mode.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Live Preview Card */}
                <div className="bg-[#152a48] border border-slate-700/80 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Live User Interface Preview
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">Interactive Preview</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0b1626] border border-slate-800 text-slate-100 space-y-3">
                    {/* Simulated Mini Header */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src="/assets/aistudio/file_00000000784c81f4b55dedd74b2223f9_6a04b5cc.png"
                          alt="Royco Logo"
                          className="w-8 h-8 rounded-lg object-cover shadow-xs border border-white/20 shrink-0"
                        />
                        <div>
                          <div className="font-black text-xs text-white">ROYCO MIX INVESTMENT</div>
                          <div className="text-[9px] text-slate-400">UGX Wallet: 250,000</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white shadow-xs"
                        style={{
                          backgroundColor:
                            selectedThemeColor === 'emerald'
                              ? '#059669'
                              : selectedThemeColor === 'purple'
                              ? '#7c3aed'
                              : selectedThemeColor === 'amber'
                              ? '#d97706'
                              : selectedThemeColor === 'rose'
                              ? '#e11d48'
                              : selectedThemeColor === 'cyan'
                              ? '#0891b2'
                              : '#1764c4',
                        }}
                      >
                        + Deposit
                      </button>
                    </div>

                    {/* Simulated Product Mini Card */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white"
                            style={{
                              backgroundColor:
                                selectedThemeColor === 'emerald'
                                  ? '#059669'
                                  : selectedThemeColor === 'purple'
                                  ? '#7c3aed'
                                  : selectedThemeColor === 'amber'
                                  ? '#d97706'
                                  : selectedThemeColor === 'rose'
                                  ? '#e11d48'
                                  : selectedThemeColor === 'cyan'
                                  ? '#0891b2'
                                  : '#1764c4',
                            }}
                          >
                            VIP Hot
                          </span>
                          <span className="font-bold text-xs text-white">ROYCO AROMA UNIT</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Share: UGX 100,000 • Yield: 6,000/day</div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-white shadow-xs"
                        style={{
                          backgroundColor:
                            selectedThemeColor === 'emerald'
                              ? '#059669'
                              : selectedThemeColor === 'purple'
                              ? '#7c3aed'
                              : selectedThemeColor === 'amber'
                              ? '#d97706'
                              : selectedThemeColor === 'rose'
                              ? '#e11d48'
                              : selectedThemeColor === 'cyan'
                              ? '#0891b2'
                              : '#1764c4',
                        }}
                      >
                        Invest
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={async () => {
                    await updateSettings({
                      themeColor: selectedThemeColor,
                      defaultThemeMode: selectedDefaultMode,
                    });
                    confetti({ particleCount: 50, spread: 60 });
                    showNotification(
                      'success',
                      `Theme palette updated to ${selectedThemeColor.toUpperCase()} & default mode to ${selectedDefaultMode.toUpperCase()}!`
                    );
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Palette className="w-4 h-4" />
                  <span>Save Theme & Apply To All Platform Users</span>
                </button>
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

              {/* Account Status / Ban & Unban Control */}
              <div className="pt-3 border-t border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account Access:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      editingUser.isBanned
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {editingUser.isBanned ? '🚫 Banned' : '✓ Active'}
                  </span>
                </div>
                {editingUser.isBanned ? (
                  <button
                    type="button"
                    onClick={() => handleUnbanUser(editingUser)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    Unban This User Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBanPromptUser(editingUser);
                      setBanReasonText('Suspended from admin control');
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-xs border border-rose-500/40 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Ban className="w-4 h-4" />
                    Ban User Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: BAN CONFIRMATION & REASON
           ========================================================================= */}
        {banPromptUser && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#152a48] border border-rose-500/50 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Ban User Account</h3>
                    <p className="text-xs text-rose-300">{banPromptUser.phone || banPromptUser.displayName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBanPromptUser(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5">
                <p>
                  Banning this account will block withdrawals, new investments, and bonus claims. The user will be notified of account suspension.
                </p>
                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-0.5">
                  <div>UID: <span className="font-mono text-slate-200">{banPromptUser.uid}</span></div>
                  <div>Wallet Balance: <strong className="text-emerald-400">UGX {(banPromptUser.balanceUGX || 0).toLocaleString()}</strong></div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Suspension:
                </label>
                <input
                  type="text"
                  value={banReasonText}
                  onChange={(e) => setBanReasonText(e.target.value)}
                  placeholder="e.g. Violation of platform policy"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBanPromptUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleBanUser(banPromptUser, banReasonText)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CREATE NEW GIFT CODE / VOUCHER
           ========================================================================= */}
        {isNewGiftModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-pink-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Create New Gift Code</h3>
                    <p className="text-[11px] text-slate-400">Give users instant cash vouchers</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewGiftModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGiftCode} className="space-y-3.5">
                {/* Code string with Auto-Generate Button */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Gift Code:</label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random Code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newGiftCode}
                    onChange={(e) => setNewGiftCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ROYCO2026, BONUS5K"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-black text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                    required
                  />
                </div>

                {/* Reward Amount UGX */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cash Reward Amount (UGX):
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={newGiftAmount === '' || newGiftAmount === 0 ? '' : newGiftAmount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewGiftAmount(v === '' ? '' : Number(v));
                    }}
                    placeholder="Enter reward amount (e.g. 5000)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />

                  {/* Preset Quick Chips */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2">
                    {[2000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setNewGiftAmount(amt)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition ${
                          newGiftAmount === amt
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Maximum Redemptions Limit */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Redemption Limit (Total Users):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2">
                    {[
                      { label: '1 User', val: 1 },
                      { label: '10 Users', val: 10 },
                      { label: '50 Users', val: 50 },
                      { label: '100 Users', val: 100 },
                      { label: 'Unlimited', val: 99999 },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.val}
                        onClick={() => setNewGiftMaxUses(opt.val)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition ${
                          newGiftMaxUses === opt.val
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={newGiftMaxUses === '' ? '' : newGiftMaxUses}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewGiftMaxUses(v === '' ? '' : Number(v));
                    }}
                    placeholder="Custom users limit (e.g. 50)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Each user UID can only redeem each code once.
                  </span>
                </div>

                {/* Note / Campaign */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Description / Campaign Note (Optional):
                  </label>
                  <input
                    type="text"
                    value={newGiftNote}
                    onChange={(e) => setNewGiftNote(e.target.value)}
                    placeholder="e.g. Telegram Channel Giveaway, Launch Special"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsNewGiftModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingGift}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingGift ? 'Saving...' : 'Save & Activate Code'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: VIEW USERS WHO REDEEMED A GIFT CODE
           ========================================================================= */}
        {viewingGiftUsers && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-blue-500/40 rounded-3xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Redemption Audit Trail</h3>
                    <p className="text-[11px] text-pink-300 font-mono font-bold">
                      Code: {viewingGiftUsers.code} (+UGX {viewingGiftUsers.amountUGX.toLocaleString()})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingGiftUsers(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {(!viewingGiftUsers.usedByUserIds || viewingGiftUsers.usedByUserIds.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No users have redeemed this gift code yet. Share the code with users to give them rewards!
                  </div>
                ) : (
                  viewingGiftUsers.usedByUserIds.map((uid, idx) => {
                    const matchedUser = allUsers.find((u) => u.uid === uid);
                    return (
                      <div
                        key={uid + idx}
                        className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{matchedUser?.displayName || 'Royco Member'}</span>
                            {matchedUser?.phone && (
                              <span className="text-[10px] text-blue-300 font-mono">
                                ({matchedUser.phone})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                            UID: {uid}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                          Redeemed
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingGiftUsers(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFIRM GIFT CODE DELETION
           ========================================================================= */}
        {giftCodeToDelete && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#152a48] border border-rose-500/50 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Delete Gift Code?</h3>
                  <p className="text-[11px] text-slate-400">Remove from system</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete gift code <strong className="text-pink-300 font-mono">{giftCodeToDelete.code}</strong> (value: UGX {giftCodeToDelete.amountUGX.toLocaleString()})? Users will no longer be able to claim this code.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGiftCodeToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGiftCode(giftCodeToDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Yes, Delete Code
                </button>
              </div>
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
