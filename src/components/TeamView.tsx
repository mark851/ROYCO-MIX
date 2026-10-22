import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Copy,
  Check,
  Share2,
  Award,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  UserPlus,
  Coins,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TeamViewProps {
  onAuthRequired?: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ onAuthRequired }) => {
  const { user, profile, teamMembers, transactions } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Each user gets their own unique referral code
  const referralCode = profile?.referralCode || (user ? `ROYCO${user.uid.slice(0, 5).toUpperCase()}` : 'ROYCO');
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : `/?ref=${referralCode}`;

  const handleCopyCode = () => {
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Real team commissions and metrics (Zero fake/simulated data)
  const commissionTransactions = transactions.filter((t) => t.type === 'commission');
  const totalTeamCount = teamMembers.length;
  const totalTeamVolume = teamMembers.reduce((acc, m) => acc + (m.totalInvestedUGX || 0), 0);
  const totalCommissionsEarned =
    (profile?.referralEarnedUGX && profile.referralEarnedUGX > 0)
      ? profile.referralEarnedUGX
      : commissionTransactions.reduce((acc, t) => acc + (t.amountUGX || 0), 0);

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Banner: User's Personal Invitation Code & Link */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 text-white shadow-md shadow-emerald-600/20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              Agent Commission Network
            </span>
            <h2 className="text-xl font-black">Royco Partner Program</h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-xs text-emerald-100 leading-relaxed">
          Invite friends to invest in Royco Mix equipment and earn an automatic <strong className="text-amber-300">10% cash reward</strong> whenever your referrals buy an investment package!
        </p>

        {/* Share box */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 border border-white/20">
          <div className="flex justify-between items-center text-xs">
            <span className="text-emerald-100 font-medium">My Unique Referral Code:</span>
            <div className="flex items-center gap-1.5 font-black text-amber-300 text-sm">
              <span className="font-mono tracking-wider">{user ? referralCode : 'Sign In To View'}</span>
              {user && (
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition active:scale-90"
                  title="Copy Referral Code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied To Clipboard!' : 'Copy & Share Exclusive Invitation Link'}</span>
          </button>
        </div>
      </div>

      {/* Commission Rates Breakdown */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" /> 3-Tier Commission Structure
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-0.5">
            <div className="text-[10px] font-bold text-emerald-700">Tier 1 Direct</div>
            <div className="text-lg font-black text-emerald-700">10%</div>
            <div className="text-[9px] text-slate-500">Every direct invite</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-0.5">
            <div className="text-[10px] font-bold text-blue-700">Tier 2 Indirect</div>
            <div className="text-lg font-black text-blue-700">3%</div>
            <div className="text-[9px] text-slate-500">Sub-agent sales</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-0.5">
            <div className="text-[10px] font-bold text-purple-700">Tier 3 Team</div>
            <div className="text-lg font-black text-purple-700">1%</div>
            <div className="text-[9px] text-slate-500">Extended network</div>
          </div>
        </div>
      </div>

      {/* Real Team Summary Metrics (Clean, fresh starting metrics) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Team</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {totalTeamCount} {totalTeamCount === 1 ? 'Member' : 'Members'}
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Team Volume</div>
          <div className="text-base font-black text-[#1764c4] mt-0.5">
            UGX {totalTeamVolume >= 1000 ? `${(totalTeamVolume / 1000).toLocaleString()}K` : totalTeamVolume.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Bonus Paid</div>
          <div className="text-base font-black text-emerald-600 mt-0.5">
            UGX {totalCommissionsEarned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Fresh State: When user has 0 team members */}
      {totalTeamCount === 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Your Team Network is Fresh</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Share your referral code <strong className="text-emerald-700 font-mono font-bold">{referralCode}</strong> with friends. When they register and purchase an equipment package, you immediately earn 10% cash into your balance!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <div className="text-[11px] font-bold text-slate-800">Share Link</div>
              <div className="text-[9px] text-slate-500">Send invite link or referral code to friends</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <div className="text-[11px] font-bold text-slate-800">Friend Joins</div>
              <div className="text-[9px] text-slate-500">Friend receives free UGX 3,000 bonus</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <div className="text-[11px] font-bold text-slate-800">Earn 10% Cash</div>
              <div className="text-[9px] text-slate-500">Instant reward when friend invests</div>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Invite Partners Now</span>
          </button>
        </div>
      )}

      {/* Real Team Members List (Rendered when members join) */}
      {totalTeamCount > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Direct Team Members ({teamMembers.length})
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Network
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {teamMembers.map((member) => (
              <div key={member.uid} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="font-mono">{member.phone}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      Tier 1
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Joined: {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Invested:</div>
                  <div className="font-black text-[#1764c4]">
                    UGX {member.totalInvestedUGX.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Referral Commission Activity Feed */}
      {commissionTransactions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" /> Referral Earnings Ledger
            </span>
            <span className="text-[10px] font-bold text-emerald-600">
              +{commissionTransactions.length} Payouts
            </span>
          </h4>

          <div className="divide-y divide-slate-100">
            {commissionTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5 max-w-[200px]">
                  <div className="font-bold text-slate-800 truncate">{tx.description}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 inline" />
                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-emerald-600">
                    +UGX {tx.amountUGX.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Wallet Credited
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
