import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  UserProfile,
  InvestmentOrder,
  FinancialTransaction,
  InvestmentProduct,
  BonusRecord,
  TeamMember,
} from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  activeInvestments: InvestmentOrder[];
  transactions: FinancialTransaction[];
  bonusClaims: BonusRecord[];
  teamMembers: TeamMember[];
  signUpWithPhone: (phone: string, password: string, invitationCode?: string) => Promise<{ success: boolean; message: string }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  deposit: (
    amount: number,
    method: string,
    phone: string,
    asPending?: boolean,
    customRef?: string
  ) => Promise<boolean>;
  withdraw: (amount: number, method: string, accountNumber: string) => Promise<{ success: boolean; message: string }>;
  invest: (product: InvestmentProduct) => Promise<{ success: boolean; message: string }>;
  claimYield: (investmentId: string) => Promise<{ success: boolean; message: string }>;
  claimDailyCheckinBonus: () => Promise<{ success: boolean; reward: number; message: string }>;
  claimWheelBonus: (rewardAmount: number) => Promise<{ success: boolean; reward: number; message: string }>;
  updatePaymentMethod: (provider: string, number: string) => Promise<void>;
  isAdmin: boolean;
  verifyOwnerAdmin: (keyOrEmail: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to format phone into email format for Firebase Auth
const phoneToEmail = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@roycomix.ug`;
};

// Local credential store to guarantee login even if Email/Password isn't enabled in console
const getStoredCredentials = (): Record<string, { uid: string; passwordHash: string; phone: string }> => {
  try {
    const raw = localStorage.getItem('royco_phone_auth_db');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCredential = (phone: string, uid: string, password: string) => {
  try {
    const db = getStoredCredentials();
    const cleanPhone = phone.replace(/\D/g, '');
    db[cleanPhone] = { uid, passwordHash: btoa(password), phone: cleanPhone };
    localStorage.setItem('royco_phone_auth_db', JSON.stringify(db));
  } catch (e) {
    console.warn('Could not cache credentials locally', e);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeInvestments, setActiveInvestments] = useState<InvestmentOrder[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [bonusClaims, setBonusClaims] = useState<BonusRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setActiveInvestments([]);
        setTransactions([]);
        setBonusClaims([]);
        setTeamMembers([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time sync for current user profile
  useEffect(() => {
    if (!user) {
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          const phoneDigits = (data.phone || '').replace(/\D/g, '');
          const emailStr = (user.email || '').toLowerCase();
          if ((phoneDigits.endsWith('700524662') || emailStr.includes('700524662') || emailStr === 'markniaras@gmail.com') && data.role !== 'admin') {
            data.role = 'admin';
            updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
          }
          setProfile(data);
          setLoading(false);
        } else {
          // Initialize user profile with exactly UGX 3,000 trial bonus for new users
          const phoneStr = user.phoneNumber || '25677' + Math.floor(1000000 + Math.random() * 9000000);
          const phoneDigits = phoneStr.replace(/\D/g, '');
          const isPhoneAdmin = phoneDigits.endsWith('700524662') || (user.email || '').includes('700524662') || (user.email || '').toLowerCase() === 'markniaras@gmail.com';
          const referralCode = 'ROYCO' + Math.floor(10000 + Math.random() * 90000);
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || `${user.uid.slice(0, 8)}@roycomix.ug`,
            displayName: isPhoneAdmin ? 'Owner Administrator' : (user.displayName || 'UGX Member'),
            phone: phoneStr,
            balanceUGX: 3000, // Fixed: UGX 3,000 trial bonus for new users joining
            totalInvestedUGX: 0,
            totalEarnedUGX: 0,
            totalWithdrawnUGX: 0,
            referralCode,
            momoNumber: phoneStr,
            momoProvider: phoneStr.startsWith('077') || phoneStr.startsWith('25677') ? 'MTN Mobile Money' : 'Airtel Money',
            role: isPhoneAdmin ? 'admin' : 'member',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);

            // Record welcome bonus of UGX 3,000 in transaction ledger
            const welcomeTxRef = doc(db, 'transactions', 'tx_welcome_' + user.uid);
            const welcomeTx: FinancialTransaction = {
              id: 'tx_welcome_' + user.uid,
              userId: user.uid,
              userEmail: user.email || 'user@roycomix.ug',
              type: 'bonus',
              amountUGX: 3000, // Fixed: UGX 3,000 trial bonus
              feeUGX: 0,
              netAmountUGX: 3000,
              method: 'New User Trial Bonus',
              status: 'completed',
              reference: 'ROYCO-TRIAL-3000',
              description: 'ROYCO MIX registration bonus & trial investment capital',
              createdAt: new Date().toISOString(),
            };
            await setDoc(welcomeTxRef, welcomeTx);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
          setLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    // 3. Investments listener
    const investmentsQuery = query(
      collection(db, 'investments'),
      where('userId', '==', user.uid)
    );
    const unsubscribeInvestments = onSnapshot(
      investmentsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as InvestmentOrder);
        items.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
        setActiveInvestments(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'investments');
      }
    );

    // 4. Transactions listener
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as FinancialTransaction);
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    );

    // 5. Bonus claims listener
    const bonusQuery = query(
      collection(db, 'bonusClaims'),
      where('userId', '==', user.uid)
    );
    const unsubscribeBonus = onSnapshot(
      bonusQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as BonusRecord);
        setBonusClaims(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bonusClaims');
      }
    );

    // 6. Team Members listener (Members who registered with this user's invitation code/UID)
    const teamQuery = query(
      collection(db, 'users'),
      where('referredByUid', '==', user.uid)
    );
    const unsubscribeTeam = onSnapshot(
      teamQuery,
      (snapshot) => {
        const members: TeamMember[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as UserProfile;
          return {
            uid: d.uid,
            phone: d.phone ? (d.phone.length > 6 ? `${d.phone.slice(0, 5)}****${d.phone.slice(-2)}` : d.phone) : 'UGX Investor',
            displayName: d.displayName,
            referralCode: d.referralCode,
            referredBy: d.referredBy,
            createdAt: d.createdAt || new Date().toISOString(),
            totalInvestedUGX: d.totalInvestedUGX || 0,
            level: 'Tier 1',
          };
        });
        setTeamMembers(members);
      },
      (error) => {
        console.warn('Team snapshot note:', error);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeInvestments();
      unsubscribeTransactions();
      unsubscribeBonus();
      unsubscribeTeam();
    };
  }, [user]);

  // Phone + Password Sign Up
  const signUpWithPhone = async (
    phone: string,
    pass: string,
    invitationCode?: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, message: 'Please enter a valid phone number (at least 9 digits)' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Resolve inviter details from code or cached ref parameter
    const invCodeRaw = (invitationCode || localStorage.getItem('royco_referred_by') || '').trim().toUpperCase();
    let inviterRefCode = '';
    let inviterUid = '';

    if (invCodeRaw) {
      try {
        const qInv = query(collection(db, 'users'), where('referralCode', '==', invCodeRaw));
        const invSnap = await getDocs(qInv);
        if (!invSnap.empty) {
          const invDoc = invSnap.docs[0];
          const invData = invDoc.data() as UserProfile;
          inviterRefCode = invData.referralCode || invCodeRaw;
          inviterUid = invData.uid || invDoc.id;
        } else {
          inviterRefCode = invCodeRaw;
        }
      } catch (err) {
        console.warn('Inviter lookup note:', err);
        inviterRefCode = invCodeRaw;
      }
    }

    const email = phoneToEmail(cleanPhone);

    try {
      // 1. Try Firebase createUserWithEmailAndPassword
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      saveCredential(cleanPhone, uid, pass);

      // Create unique profile with dedicated referral code and UGX 3,000 welcome trial
      const referralCode = 'ROYCO' + Math.floor(10000 + Math.random() * 90000);
      const newProfile: UserProfile = {
        uid,
        email,
        displayName: cleanPhone.endsWith('700524662') ? 'Owner Administrator' : `Investor (${cleanPhone.slice(-4)})`,
        phone: cleanPhone,
        balanceUGX: 3000, // UGX 3,000 trial bonus
        totalInvestedUGX: 0,
        totalEarnedUGX: 0,
        totalWithdrawnUGX: 0,
        referralCode,
        referredBy: inviterRefCode || undefined,
        referredByUid: inviterUid || undefined,
        referralEarnedUGX: 0,
        momoNumber: cleanPhone,
        momoProvider: cleanPhone.startsWith('077') || cleanPhone.startsWith('25677') || cleanPhone.startsWith('078') || cleanPhone.startsWith('25678') ? 'MTN Mobile Money' : 'Airtel Money',
        role: cleanPhone.endsWith('700524662') ? 'admin' : 'member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), newProfile);

      // Record welcome trial bonus
      const welcomeTx: FinancialTransaction = {
        id: 'tx_welcome_' + uid,
        userId: uid,
        userEmail: email,
        type: 'bonus',
        amountUGX: 3000,
        feeUGX: 0,
        netAmountUGX: 3000,
        method: 'New User Trial Bonus',
        status: 'completed',
        reference: 'ROYCO-TRIAL-3000',
        description: 'ROYCO MIX signup reward & trial bonus',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'transactions', welcomeTx.id), welcomeTx);

      return {
        success: true,
        message: 'Account created successfully! UGX 3,000 trial bonus has been credited to your balance.',
      };
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };

      if (errObj.code === 'auth/email-already-in-use') {
        return {
          success: false,
          message: 'An account with this phone number already exists. Please sign in instead.',
        };
      }

      // If email/password provider is not toggled on in Firebase Console, fallback to anonymous session
      if (errObj.code === 'auth/operation-not-allowed' || errObj.code === 'auth/admin-restricted-operation') {
        try {
          const cred = await signInAnonymously(auth);
          const uid = cred.user.uid;
          saveCredential(cleanPhone, uid, pass);

          const referralCode = 'ROYCO' + Math.floor(10000 + Math.random() * 90000);
          const isOwnerAccount = cleanPhone.endsWith('700524662');
          const fallbackProfile: UserProfile = {
            uid,
            email,
            displayName: isOwnerAccount ? 'Owner Administrator' : `Investor (${cleanPhone.slice(-4)})`,
            phone: cleanPhone,
            balanceUGX: 3000,
            totalInvestedUGX: 0,
            totalEarnedUGX: 0,
            totalWithdrawnUGX: 0,
            referralCode,
            referredBy: inviterRefCode || undefined,
            referredByUid: inviterUid || undefined,
            referralEarnedUGX: 0,
            momoNumber: cleanPhone,
            momoProvider: 'MTN Mobile Money',
            role: isOwnerAccount ? 'admin' : 'member',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'users', uid), fallbackProfile);

          if (isOwnerAccount) {
            try {
              await setDoc(doc(db, 'admins', uid), {
                uid,
                phone: cleanPhone,
                role: 'admin',
                createdAt: new Date().toISOString(),
              });
            } catch {}
          }

          const welcomeTx: FinancialTransaction = {
            id: 'tx_welcome_' + uid,
            userId: uid,
            userEmail: email,
            type: 'bonus',
            amountUGX: 3000,
            feeUGX: 0,
            netAmountUGX: 3000,
            method: 'New User Trial Bonus',
            status: 'completed',
            reference: 'ROYCO-TRIAL-3000',
            description: 'ROYCO MIX signup reward & trial bonus',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'transactions', welcomeTx.id), welcomeTx);

          return {
            success: true,
            message: 'Account created successfully! UGX 3,000 trial bonus has been credited.',
          };
        } catch (anonErr) {
          console.error(anonErr);
          return { success: false, message: 'Could not create account at this time.' };
        }
      }

      return {
        success: false,
        message: errObj.message || 'Failed to create account. Please check your credentials.',
      };
    }
  };

  // Phone + Password Sign In
  const signInWithPhone = async (
    phone: string,
    pass: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, message: 'Please enter a valid phone number' };
    }
    if (!pass) {
      return { success: false, message: 'Please enter your password' };
    }

    const email = phoneToEmail(cleanPhone);
    const isOwner = cleanPhone.endsWith('700524662');

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true, message: 'Signed in successfully!' };
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };

      // Fallback check against cached credentials if email/password isn't enabled in console
      const stored = getStoredCredentials()[cleanPhone];
      if (stored) {
        if (stored.passwordHash === btoa(pass)) {
          const cred = await signInAnonymously(auth);
          if (isOwner) {
            try {
              await updateDoc(doc(db, 'users', cred.user.uid), {
                role: 'admin',
                phone: cleanPhone,
                updatedAt: new Date().toISOString(),
              });
              await setDoc(doc(db, 'admins', cred.user.uid), {
                uid: cred.user.uid,
                phone: cleanPhone,
                role: 'admin',
                updatedAt: new Date().toISOString(),
              });
            } catch {}
          }
          return { success: true, message: 'Signed in successfully!' };
        } else {
          return { success: false, message: 'Incorrect password for this phone number' };
        }
      }

      // If owner 0700524662 tries to sign in but account doesn't exist yet, auto-create it!
      if (isOwner && (errObj.code === 'auth/user-not-found' || errObj.code === 'auth/invalid-credential')) {
        return await signUpWithPhone(cleanPhone, pass);
      }

      if (errObj.code === 'auth/user-not-found' || errObj.code === 'auth/invalid-credential') {
        return {
          success: false,
          message: 'Account not found with this number or incorrect password. Please sign up first.',
        };
      }
      if (errObj.code === 'auth/wrong-password') {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      return {
        success: false,
        message: errObj.message || 'Failed to sign in. Please verify your number and password.',
      };
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  // Financial actions
  const deposit = async (
    amount: number,
    method: string,
    phone: string,
    asPending = false,
    customRef?: string
  ): Promise<boolean> => {
    if (!user || !profile) return false;
    const txId = 'tx_dep_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const cleanRef = customRef?.trim() || ('LWORX-' + Math.floor(10000000 + Math.random() * 90000000));

    const newTx: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      type: 'deposit',
      amountUGX: amount,
      feeUGX: 0,
      netAmountUGX: amount,
      method,
      accountNumber: phone,
      status: asPending ? 'pending' : 'completed',
      reference: cleanRef,
      description: `Recharge via ${method} (${phone}) - Lworx Pay: https://lworxpaysolutions.com/pay/royco-mix-investment`,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'transactions', txId), newTx);

      if (!asPending) {
        const newBalance = (profile.balanceUGX || 0) + amount;
        await updateDoc(doc(db, 'users', user.uid), {
          balanceUGX: newBalance,
          phone: phone || profile.phone,
          updatedAt: now,
        });
      }

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
      return false;
    }
  };

  const withdraw = async (
    amount: number,
    method: string,
    accountNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please sign in first' };
    if (profile.isBanned) {
      return {
        success: false,
        message: `Account Suspended: ${profile.banReason || 'Your account has been banned by the administrator. Contact official support.'}`,
      };
    }

    const minWithdrawal = 5000;
    if (amount < minWithdrawal) {
      return { success: false, message: `Minimum withdrawal is UGX ${minWithdrawal.toLocaleString()}` };
    }

    if (profile.balanceUGX < amount) {
      return { success: false, message: 'Insufficient wallet balance for this withdrawal' };
    }

    const fee = Math.round(amount * 0.05); // 5% standard mobile money withdrawal fee
    const netAmount = amount - fee;
    const txId = 'tx_wd_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();

    const newTx: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || profile.displayName || 'user@roycomix.ug',
      userPhone: profile.phone || accountNumber,
      userName: profile.displayName || 'Investor',
      type: 'withdrawal',
      amountUGX: amount,
      feeUGX: fee,
      netAmountUGX: netAmount,
      method,
      accountNumber,
      status: 'pending',
      reference: 'PAYOUT-' + Math.floor(10000000 + Math.random() * 90000000),
      description: `Withdrawal to ${method} (${accountNumber}) - Pending Admin Approval`,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'transactions', txId), newTx);

      const newBalance = profile.balanceUGX - amount;

      await updateDoc(doc(db, 'users', user.uid), {
        balanceUGX: newBalance,
        momoNumber: accountNumber,
        momoProvider: method,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Withdrawal request for UGX ${netAmount.toLocaleString()} submitted! Your request is on PENDING in the admin panel until approved by the administrator. Once approved, the payout will be transferred to your ${method} account (${accountNumber}).`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
      return { success: false, message: 'Failed to process withdrawal request' };
    }
  };

  const invest = async (product: InvestmentProduct): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please sign in first' };
    if (profile.isBanned) {
      return {
        success: false,
        message: `Account Suspended: ${profile.banReason || 'Your account has been banned by the administrator. Contact official support.'}`,
      };
    }

    // Check user limit
    const existingCount = activeInvestments.filter((i) => i.productId === product.id).length;
    if (existingCount >= product.limitPerUser) {
      return { success: false, message: `You have reached the purchase limit (${product.limitPerUser}) for this package` };
    }

    // Check balance
    if (profile.balanceUGX < product.shareValueUGX) {
      const diff = product.shareValueUGX - profile.balanceUGX;
      return {
        success: false,
        message: `Insufficient balance. Please recharge UGX ${diff.toLocaleString()} to complete this purchase`,
      };
    }

    const orderId = 'inv_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const txId = 'tx_inv_' + Date.now();
    const now = new Date().toISOString();

    const order: InvestmentOrder = {
      id: orderId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      productId: product.id,
      productName: product.name,
      shareValueUGX: product.shareValueUGX,
      dailyReturnUGX: product.dailyReturnUGX,
      totalReturnUGX: product.totalReturnUGX,
      contractDays: product.contractDays,
      daysElapsed: 1,
      claimedReturnUGX: 0,
      lastClaimDate: '',
      status: 'active',
      purchasedAt: now,
    };

    const transaction: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      type: 'investment',
      amountUGX: product.shareValueUGX,
      feeUGX: 0,
      netAmountUGX: product.shareValueUGX,
      method: 'Royco Wallet Capital',
      status: 'completed',
      reference: 'INV-' + orderId.slice(-6).toUpperCase(),
      description: `Purchased ${product.name} (${product.contractDays} Days Contract)`,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'investments', orderId), order);
      await setDoc(doc(db, 'transactions', txId), transaction);

      const newBalance = profile.balanceUGX - product.shareValueUGX;
      const totalInvested = (profile.totalInvestedUGX || 0) + product.shareValueUGX;

      await updateDoc(doc(db, 'users', user.uid), {
        balanceUGX: newBalance,
        totalInvestedUGX: totalInvested,
        updatedAt: now,
      });

      // Automatic Referral Reward Distribution
      const refCodeTarget = (profile.referredBy || '').trim().toUpperCase();
      const refUidTarget = profile.referredByUid;

      if (refUidTarget || refCodeTarget) {
        try {
          let uplineDocSnap = null;
          let uplineUid = refUidTarget;

          if (uplineUid) {
            const docRef = doc(db, 'users', uplineUid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              uplineDocSnap = snap;
            }
          }

          if (!uplineDocSnap && refCodeTarget) {
            const qUpline = query(collection(db, 'users'), where('referralCode', '==', refCodeTarget));
            const snapQ = await getDocs(qUpline);
            if (!snapQ.empty) {
              uplineDocSnap = snapQ.docs[0];
              uplineUid = uplineDocSnap.id;
            }
          }

          if (uplineDocSnap && uplineUid && uplineUid !== user.uid) {
            const uplineData = uplineDocSnap.data() as UserProfile;
            // Level 1: 10% direct referral reward
            const rewardL1 = Math.round(product.shareValueUGX * 0.10);
            const uplineNewBal = (uplineData.balanceUGX || 0) + rewardL1;
            const uplineNewEarned = (uplineData.totalEarnedUGX || 0) + rewardL1;
            const uplineNewRef = (uplineData.referralEarnedUGX || 0) + rewardL1;

            await updateDoc(doc(db, 'users', uplineUid), {
              balanceUGX: uplineNewBal,
              totalEarnedUGX: uplineNewEarned,
              referralEarnedUGX: uplineNewRef,
              updatedAt: now,
            });

            const maskedPhone = profile.phone
              ? profile.phone.length > 5
                ? `${profile.phone.slice(0, 5)}****${profile.phone.slice(-2)}`
                : profile.phone
              : 'Invited Member';

            const commTx1: FinancialTransaction = {
              id: 'tx_comm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              userId: uplineUid,
              userEmail: uplineData.email || 'partner@roycomix.ug',
              type: 'commission',
              amountUGX: rewardL1,
              feeUGX: 0,
              netAmountUGX: rewardL1,
              method: 'Direct Referral Reward (10%)',
              status: 'completed',
              reference: 'COMM-' + orderId.slice(-6).toUpperCase(),
              description: `10% referral reward (+UGX ${rewardL1.toLocaleString()}) from ${maskedPhone} investing in ${product.name}`,
              createdAt: now,
            };
            await setDoc(doc(db, 'transactions', commTx1.id), commTx1);

            // Level 2 (3% to upline's inviter if present)
            if (uplineData.referredByUid && uplineData.referredByUid !== user.uid && uplineData.referredByUid !== uplineUid) {
              try {
                const l2Snap = await getDoc(doc(db, 'users', uplineData.referredByUid));
                if (l2Snap.exists()) {
                  const l2Data = l2Snap.data() as UserProfile;
                  const rewardL2 = Math.round(product.shareValueUGX * 0.03);
                  await updateDoc(doc(db, 'users', uplineData.referredByUid), {
                    balanceUGX: (l2Data.balanceUGX || 0) + rewardL2,
                    totalEarnedUGX: (l2Data.totalEarnedUGX || 0) + rewardL2,
                    referralEarnedUGX: (l2Data.referralEarnedUGX || 0) + rewardL2,
                    updatedAt: now,
                  });

                  const commTx2: FinancialTransaction = {
                    id: 'tx_comm_l2_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                    userId: uplineData.referredByUid,
                    userEmail: l2Data.email || 'partner@roycomix.ug',
                    type: 'commission',
                    amountUGX: rewardL2,
                    feeUGX: 0,
                    netAmountUGX: rewardL2,
                    method: 'Tier 2 Referral Commission (3%)',
                    status: 'completed',
                    reference: 'COMM-L2-' + orderId.slice(-6).toUpperCase(),
                    description: `3% Tier 2 commission (+UGX ${rewardL2.toLocaleString()}) from ${maskedPhone} investing in ${product.name}`,
                    createdAt: now,
                  };
                  await setDoc(doc(db, 'transactions', commTx2.id), commTx2);
                }
              } catch (l2Error) {
                console.warn('L2 referral distribution error:', l2Error);
              }
            }
          }
        } catch (rewardErr) {
          console.warn('Referral reward calculation error:', rewardErr);
        }
      }

      return {
        success: true,
        message: `Successfully purchased ${product.name}! Daily profit of UGX ${product.dailyReturnUGX.toLocaleString()} activated.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `investments/${orderId}`);
      return { success: false, message: 'Investment order could not be placed' };
    }
  };

  const claimYield = async (investmentId: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Please sign in first' };
    if (profile.isBanned) {
      return { success: false, message: 'Account Suspended: Cannot claim yield while your account is banned.' };
    }

    const inv = activeInvestments.find((i) => i.id === investmentId);
    if (!inv) return { success: false, message: 'Investment contract not found' };

    const today = new Date().toISOString().slice(0, 10);
    if (inv.lastClaimDate === today) {
      return { success: false, message: 'Daily yield for today has already been settled. Next yield unlocks tomorrow!' };
    }

    const yieldAmount = inv.dailyReturnUGX;
    const txId = 'tx_yield_' + Date.now();
    const now = new Date().toISOString();

    const newClaimed = (inv.claimedReturnUGX || 0) + yieldAmount;
    const newDaysElapsed = (inv.daysElapsed || 1) + 1;
    const isCompleted = newDaysElapsed >= inv.contractDays || newClaimed >= inv.totalReturnUGX;

    const yieldTx: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      type: 'daily_yield',
      amountUGX: yieldAmount,
      feeUGX: 0,
      netAmountUGX: yieldAmount,
      method: 'Automated Contract Yield',
      status: 'completed',
      reference: 'YIELD-' + inv.id.slice(-6).toUpperCase(),
      description: `Daily production yield from ${inv.productName}`,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'transactions', txId), yieldTx);

      await updateDoc(doc(db, 'investments', inv.id), {
        claimedReturnUGX: newClaimed,
        daysElapsed: newDaysElapsed,
        lastClaimDate: today,
        status: isCompleted ? 'completed' : 'active',
      });

      const newBalance = profile.balanceUGX + yieldAmount;
      const totalEarned = (profile.totalEarnedUGX || 0) + yieldAmount;

      await updateDoc(doc(db, 'users', user.uid), {
        balanceUGX: newBalance,
        totalEarnedUGX: totalEarned,
        updatedAt: now,
      });

      return {
        success: true,
        message: `Claimed UGX ${yieldAmount.toLocaleString()} daily yield into your wallet!`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `investments/${inv.id}`);
      return { success: false, message: 'Failed to claim daily yield' };
    }
  };

  const claimDailyCheckinBonus = async (): Promise<{ success: boolean; reward: number; message: string }> => {
    if (!user || !profile) return { success: false, reward: 0, message: 'Please sign in first' };
    if (profile.isBanned) return { success: false, reward: 0, message: 'Account Suspended: Cannot claim bonuses while account is banned.' };

    const today = new Date().toISOString().slice(0, 10);
    const existing = bonusClaims.find(
      (b) => b.claimType === 'daily_checkin' && b.claimDate === today
    );

    if (existing) {
      return { success: false, reward: 0, message: "You have already completed today's check-in! Come back tomorrow." };
    }

    const reward = 1000;
    const claimId = 'bonus_chk_' + today.replace(/-/g, '') + '_' + user.uid.slice(0, 8);
    const txId = 'tx_bonus_' + Date.now();
    const now = new Date().toISOString();

    const bonusDoc: BonusRecord = {
      id: claimId,
      userId: user.uid,
      claimType: 'daily_checkin',
      rewardUGX: reward,
      claimDate: today,
      createdAt: now,
    };

    const bonusTx: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      type: 'bonus',
      amountUGX: reward,
      feeUGX: 0,
      netAmountUGX: reward,
      method: 'Daily Attendance Reward',
      status: 'completed',
      reference: 'BONUS-CHECKIN',
      description: 'Daily check-in attendance cash bonus',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'bonusClaims', claimId), bonusDoc);
      await setDoc(doc(db, 'transactions', txId), bonusTx);

      const newBalance = profile.balanceUGX + reward;
      const totalEarned = (profile.totalEarnedUGX || 0) + reward;

      await updateDoc(doc(db, 'users', user.uid), {
        balanceUGX: newBalance,
        totalEarnedUGX: totalEarned,
        updatedAt: now,
      });

      return {
        success: true,
        reward,
        message: `Daily attendance reward of UGX ${reward.toLocaleString()} credited to your balance!`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bonusClaims/${claimId}`);
      return { success: false, reward: 0, message: 'Failed to claim daily check-in bonus' };
    }
  };

  const claimWheelBonus = async (rewardAmount: number): Promise<{ success: boolean; reward: number; message: string }> => {
    if (!user || !profile) return { success: false, reward: 0, message: 'Please sign in' };
    if (profile.isBanned) return { success: false, reward: 0, message: 'Account Suspended: Cannot claim bonuses while account is banned.' };
    if (rewardAmount <= 0) return { success: false, reward: 0, message: 'Invalid reward amount' };

    const claimId = 'bonus_wheel_' + Date.now();
    const txId = 'tx_wheel_' + Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const bonusDoc: BonusRecord = {
      id: claimId,
      userId: user.uid,
      claimType: 'wheel_spin',
      rewardUGX: rewardAmount,
      claimDate: today,
      createdAt: now,
    };

    const bonusTx: FinancialTransaction = {
      id: txId,
      userId: user.uid,
      userEmail: user.email || 'user@roycomix.ug',
      type: 'bonus',
      amountUGX: rewardAmount,
      feeUGX: 0,
      netAmountUGX: rewardAmount,
      method: 'Lucky Spin Prize',
      status: 'completed',
      reference: 'BONUS-SPIN',
      description: 'Lucky prize wheel instant cash payout',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'bonusClaims', claimId), bonusDoc);
      await setDoc(doc(db, 'transactions', txId), bonusTx);

      const newBalance = profile.balanceUGX + rewardAmount;
      const totalEarned = (profile.totalEarnedUGX || 0) + rewardAmount;

      await updateDoc(doc(db, 'users', user.uid), {
        balanceUGX: newBalance,
        totalEarnedUGX: totalEarned,
        updatedAt: now,
      });

      return {
        success: true,
        reward: rewardAmount,
        message: `Won UGX ${rewardAmount.toLocaleString()} from Lucky Wheel!`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bonusClaims/${claimId}`);
      return { success: false, reward: 0, message: 'Failed to record prize' };
    }
  };

  const updatePaymentMethod = async (provider: string, number: string) => {
    if (!user || !profile) return;
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        momoProvider: provider,
        momoNumber: number,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const cleanPhone = (profile?.phone || '').replace(/\D/g, '');
  const cleanUserEmail = (user?.email || '').toLowerCase();
  const cleanProfileEmail = (profile?.email || '').toLowerCase();

  const isAdmin = Boolean(
    cleanPhone.endsWith('700524662') ||
    cleanUserEmail.includes('700524662') ||
    cleanProfileEmail.includes('700524662') ||
    cleanUserEmail === 'markniaras@gmail.com' ||
    cleanProfileEmail === 'markniaras@gmail.com' ||
    profile?.role === 'admin'
  );

  const verifyOwnerAdmin = async (
    keyOrEmail: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Please sign in first' };
    const clean = keyOrEmail.trim().toLowerCase().replace(/\D/g, '');
    const cleanText = keyOrEmail.trim().toLowerCase();

    // Verify against owner account 0700524662 or email markniaras@gmail.com or owner key
    if (
      clean.endsWith('700524662') ||
      cleanText === 'markniaras@gmail.com' ||
      cleanText === 'markniaras' ||
      cleanText === 'admin8821'
    ) {
      try {
        const now = new Date().toISOString();
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          email: 'markniaras@gmail.com',
          phone: profile?.phone || '0700524662',
          updatedAt: now,
        });

        // Also record in admins collection for security rule clearance
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: 'markniaras@gmail.com',
          phone: '0700524662',
          role: 'admin',
          verifiedAt: now,
        });

        return {
          success: true,
          message: 'Owner account confirmed! Administrator Panel is now unlocked.',
        };
      } catch (err) {
        return { success: false, message: 'Could not grant admin permissions' };
      }
    }

    return {
      success: false,
      message: 'Access denied. Administrator panel is restricted to authorized platform owners.',
    };
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      activeInvestments,
      transactions,
      bonusClaims,
      teamMembers,
      signUpWithPhone,
      signInWithPhone,
      signOut,
      deposit,
      withdraw,
      invest,
      claimYield,
      claimDailyCheckinBonus,
      claimWheelBonus,
      updatePaymentMethod,
      isAdmin,
      verifyOwnerAdmin,
    }),
    [user, profile, loading, activeInvestments, transactions, bonusClaims, teamMembers, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
