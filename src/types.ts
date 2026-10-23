export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  balanceUGX: number;
  totalInvestedUGX: number;
  totalEarnedUGX: number;
  totalWithdrawnUGX: number;
  referralCode: string;
  referredBy?: string;
  referredByUid?: string;
  referralEarnedUGX?: number;
  momoNumber?: string;
  momoProvider?: string;
  role: 'member' | 'admin';
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  uid: string;
  phone: string;
  displayName?: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  totalInvestedUGX: number;
  level: 'Tier 1' | 'Tier 2' | 'Tier 3';
}

export interface InvestmentProduct {
  id: string;
  name: string;
  category: string;
  tag?: string;
  shareValueUGX: number;
  dailyReturnUGX: number;
  contractDays: number;
  totalReturnUGX: number;
  limitPerUser: number;
  imageUrl: string;
  description: string;
  highlights: string[];
}

export interface InvestmentOrder {
  id: string;
  userId: string;
  userEmail?: string;
  productId: string;
  productName: string;
  shareValueUGX: number;
  dailyReturnUGX: number;
  totalReturnUGX: number;
  contractDays: number;
  daysElapsed: number;
  claimedReturnUGX: number;
  lastClaimDate?: string;
  status: 'active' | 'completed';
  purchasedAt: string;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'daily_yield' | 'bonus' | 'commission';
  amountUGX: number;
  feeUGX?: number;
  netAmountUGX?: number;
  method?: string;
  accountNumber?: string;
  status: 'completed' | 'pending' | 'rejected';
  reference?: string;
  description?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
}

export interface BonusRecord {
  id: string;
  userId: string;
  claimType: 'daily_checkin' | 'wheel_spin' | 'gift_code' | 'invite_milestone';
  rewardUGX: number;
  claimDate: string;
  createdAt: string;
  code?: string;
}

export interface GiftCode {
  id: string;
  code: string;
  amountUGX: number;
  maxUses: number;
  usedCount: number;
  usedByUserIds: string[];
  status: 'active' | 'disabled' | 'expired';
  note?: string;
  createdAt: string;
  createdBy?: string;
}

