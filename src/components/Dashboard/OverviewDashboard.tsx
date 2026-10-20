import React, { useState } from 'react';
import { Student, FeeTransaction, UserSession } from '../../types/fee';
import { BirthdayCelebrationBanner } from '../Common/BirthdayCelebrationBanner';
import { checkIsBirthdayToday } from '../../utils/birthdayHelper';
import { 
  Building2, 
  QrCode, 
  Trophy, 
  ChevronDown, 
  ChevronRight, 
  RotateCw, 
  ShieldCheck, 
  Receipt,
  UserCheck
} from 'lucide-react';

interface Props {
  students: Student[];
  transactions: FeeTransaction[];
  onNavigate: (tab: string) => void;
  onViewReceipt: (tx: FeeTransaction) => void;
  session?: UserSession | null;
  effectiveStaffPhoto?: string | null;
  dynamicQrActive?: boolean;
  onOpenDynamicQr?: () => void;
  onOpenHonors?: () => void;
  onOpenStaffProfileModal?: () => void;
  onSyncNow?: () => Promise<void> | void;
  isSyncing?: boolean;
  lastSynced?: Date | null;
}

export const OverviewDashboard: React.FC<Props> = ({ 
  students, 
  transactions, 
  onNavigate,
  onViewReceipt,
  session,
  effectiveStaffPhoto,
  dynamicQrActive = true,
  onOpenDynamicQr,
  onOpenHonors,
  onOpenStaffProfileModal,
  onSyncNow,
  isSyncing = false,
  lastSynced = null,
}) => {
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(false);

  // 1. Financial Aggregations directly from students state (strict ₹0 handling, no fake numbers)
  const totalBilled = students.reduce((acc, s) => acc + (s.totalFee || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (s.paidFee || 0), 0);
  const totalPending = students.reduce((acc, s) => acc + (s.pendingFee || 0), 0);
  const totalLateFines = students.reduce((acc, s) => acc + (s.lateFineApplied || 0), 0);
  const defaulterCount = students.filter((s) => (s.pendingFee || 0) > 0).length;
  const collectionRate = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 0;

  // 2. Dynamic Payment Modes breakdown computed directly from settled transactions
  const successfulTx = transactions.filter((t) => t.status === 'Success');
  const upiTxs = successfulTx.filter((t) => t.paymentMethod === 'UPI');
  const netBankingTxs = successfulTx.filter((t) => t.paymentMethod === 'NetBanking');
  const cardTxs = successfulTx.filter((t) => t.paymentMethod === 'Card');
  const counterTxs = successfulTx.filter((t) => 
    ['Cash', 'Demand Draft', 'Challan', 'POS', 'Cheque'].includes(t.paymentMethod)
  );

  const upiAmount = upiTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  const netBankingAmount = netBankingTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  const cardAmount = cardTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
  const counterAmount = counterTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

  const txSum = upiAmount + netBankingAmount + cardAmount + counterAmount;
  const getPercent = (amt: number) => {
    if (txSum > 0) return Math.round((amt / txSum) * 100);
    return 0;
  };

  const paymentModes = [
    {
      id: 'upi',
      name: 'UPI & Dynamic QR',
      percent: getPercent(upiAmount),
      amount: upiAmount,
      txCount: upiTxs.length,
      color: '#0B5D45', // Primary Deep Green
    },
    {
      id: 'netbanking',
      name: 'NetBanking',
      percent: getPercent(netBankingAmount),
      amount: netBankingAmount,
      txCount: netBankingTxs.length,
      color: '#15803D', // Forest Green
    },
    {
      id: 'cards',
      name: 'Cards',
      percent: getPercent(cardAmount),
      amount: cardAmount,
      txCount: cardTxs.length,
      color: '#059669', // Emerald Accent
    },
    {
      id: 'counter',
      name: 'Counter Cash & DD',
      percent: getPercent(counterAmount),
      amount: counterAmount,
      txCount: counterTxs.length,
      color: '#10B981', // Mint Green
    },
  ];

  // Helper for Indian initials
  const getInitials = (name?: string) => {
    if (!name) return 'MK';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Format last synced timestamp
  const formatSyncedTime = (date: Date | null) => {
    if (!date) return 'Just now';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // SVG circular progress ring calculations (r = 26)
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringCircumference * Math.min(collectionRate, 100)) / 100;

  // Donut chart stroke dash calculations (r = 44)
  const donutRadius = 44;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~276.46

  // Check if today matches logged-in staff member's dateOfBirth
  const staffBirthdayStatus = checkIsBirthdayToday(session?.dateOfBirth);

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 py-2 space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-[calc(2.5rem+env(safe-area-inset-bottom))] overflow-x-hidden">
      {/* Birthday Celebration Banner for Staff User */}
      {staffBirthdayStatus.isBirthdayToday && (
        <BirthdayCelebrationBanner
          userName={session?.name || 'Staff Member'}
          userRole="staff"
          userIdentifier={session?.staffRole || session?.staffDesignation}
          formattedDob={staffBirthdayStatus.formattedDob}
        />
      )}
      
      {/* ======================================================== */}
      {/* 1. PROFILE AS ONE COMPACT ROW                           */}
      {/* ======================================================== */}
      {session && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-left min-h-[44px] cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            aria-expanded={isProfileExpanded}
            aria-label="Toggle staff profile credentials and treasury details"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* 44px Avatar */}
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full overflow-hidden shrink-0 border-2 border-[#0B5D45] ring-2 ring-[#0B5D45]/15 flex items-center justify-center bg-[#0B5D45] text-white font-bold text-sm shadow-xs">
                {effectiveStaffPhoto ? (
                  <img
                    src={effectiveStaffPhoto}
                    alt={session.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(session.name)}</span>
                )}
              </div>

              {/* Text: Name, truncated email, one line IFMS credentials */}
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block leading-tight">
                  {session.name || 'Manoj Kumar Sharma'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5 max-w-[210px]">
                  {session.emailOrPhone || 'manoj.sharma@rlsy.edu.in'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate block mt-0.5">
                  DDO 2049 · RLSY Patna · State Treasury IFMS
                </span>
              </div>
            </div>

            {/* Single Chevron without duplicate icons or empty space */}
            <div className="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
              <ChevronDown 
                className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                  isProfileExpanded ? 'rotate-180 text-[#0B5D45]' : ''
                }`} 
              />
            </div>
          </button>

          {/* Expandable DDO & Treasury Detail Drawer */}
          {isProfileExpanded && (
            <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-xs space-y-2.5 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-500 font-medium">Designation:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {session.staffRole === 'App_Admin' 
                    ? 'Central IT & Systems Admin' 
                    : (session.staffDesignation || 'Principal & DDO')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-500 font-medium">Treasury Authorization:</span>
                <span className="font-mono font-bold text-[#0B5D45] dark:text-emerald-400">
                  IFMS-PATNA-2049-SEC
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-500 font-medium">Statutory Compliance:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B5D45]" />
                  <span>DDO Clearance Active</span>
                </span>
              </div>
              
              {onOpenStaffProfileModal && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={onOpenStaffProfileModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-[#0B5D45] flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer shadow-2xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-[#0B5D45]" />
                    <span>Manage Staff Profile & Photo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. QUICK ACTIONS: 3-COLUMN ROW OF ICON TILES            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Tile 1: Dynamic QR (Active) */}
        <button
          type="button"
          onClick={onOpenDynamicQr}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#0B5D45]/60 hover:bg-emerald-50/20 transition-all min-h-[76px] cursor-pointer group"
          title="Configure Dynamic UPI QR and bank accounts"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D45] dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5 text-[#0B5D45]" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight text-center">
            Dynamic QR
          </span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-none mt-0.5">
            ({dynamicQrActive ? 'Active' : 'Inactive'})
          </span>
        </button>

        {/* Tile 2: Honors */}
        <button
          type="button"
          onClick={onOpenHonors}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#0B5D45]/60 hover:bg-emerald-50/20 transition-all min-h-[76px] cursor-pointer group"
          title="Field student honors and academic achievements"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D45] dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-[#0B5D45]" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight text-center">
            Honors
          </span>
          <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">
            Records
          </span>
        </button>

        {/* Tile 3: Edit college */}
        <button
          type="button"
          onClick={() => onNavigate('college_profile')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#0B5D45]/60 hover:bg-emerald-50/20 transition-all min-h-[76px] cursor-pointer group"
          title="Amend College Profile, Affiliation & Statutory Details"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D45] dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-[#0B5D45]" />
          </div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight text-center">
            Edit college
          </span>
          <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">
            Profile
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. HERO MONEY CARD WITH DARK-GREEN GRADIENT              */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-[#0B5D45] via-[#094E3A] to-[#06392B] text-white rounded-2xl p-4 shadow-sm border border-emerald-900/60 space-y-3 relative overflow-hidden">
        {/* Subtle institutional watermark background */}
        <div className="absolute right-[-18px] bottom-[-18px] opacity-10 pointer-events-none text-white">
          <Building2 className="w-36 h-36" />
        </div>

        {/* Top Split: Circular Progress Ring & Collection Summary */}
        <div className="flex items-center gap-3.5 relative z-10">
          {/* Circular Progress Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              {/* Background track circle */}
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-white/20"
              />
              {/* Progress stroke */}
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                fill="none"
                stroke="#34D399"
                strokeWidth="5"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-numbers font-bold text-xs sm:text-sm text-white">
                {collectionRate}%
              </span>
            </div>
          </div>

          {/* Collection Headline & Session */}
          <div className="min-w-0 flex-1">
            <div className="font-numbers font-bold text-base sm:text-lg leading-tight tracking-tight text-white">
              ₹{totalCollected.toLocaleString('en-IN')} <span className="font-sans font-normal text-xs text-emerald-200">collected of</span> ₹{totalBilled.toLocaleString('en-IN')} <span className="font-sans font-normal text-xs text-emerald-200">billed</span>
            </div>
            <div className="text-xs text-emerald-200 font-medium mt-1">
              Session 2025-26
            </div>
          </div>
        </div>

        {/* Bottom Bar: Last Synced Time & On-Demand 'Sync Now' Button */}
        <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2 relative z-10">
          <div className="text-[11px] text-emerald-200/90 font-medium truncate">
            Last synced: {formatSyncedTime(lastSynced)}
          </div>

          {onSyncNow && (
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/25 shadow-2xs disabled:opacity-50"
              title="Fetch and update collection data from live database"
              aria-label="Sync data from database now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. 2-COLUMN GRID: OUTSTANDING & LATE FINES              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-3">
        {/* Outstanding Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize block">
              Outstanding
            </span>
            <div className="text-xl sm:text-2xl font-bold font-numbers text-rose-700 dark:text-rose-400 tracking-tight mt-1">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {/* Tappable red chip */}
            <button
              type="button"
              onClick={() => onNavigate('defaulters')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[11px] font-semibold flex items-center justify-between cursor-pointer hover:bg-rose-100 transition-colors"
            >
              <span className="truncate">{defaulterCount} students overdue</span>
            </button>

            {/* View roster link */}
            <button
              type="button"
              onClick={() => onNavigate('defaulters')}
              className="min-h-[44px] w-full text-xs font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400 flex items-center gap-1 cursor-pointer pt-0.5"
            >
              <span>View roster ›</span>
            </button>
          </div>
        </div>

        {/* Late Fines Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize block">
              Late fines
            </span>
            <div className="text-xl sm:text-2xl font-bold font-numbers text-amber-700 dark:text-amber-400 tracking-tight mt-1">
              ₹{totalLateFines.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {/* Auto tiered rules chip */}
            <div className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold text-center truncate">
              Auto tiered rules
            </div>

            {/* NAAC compliant note */}
            <div className="min-h-[44px] text-[11px] text-slate-500 dark:text-slate-400 flex items-center font-medium pt-0.5">
              <span>NAAC compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. PAYMENT MODES: DONUT CHART + LEGEND                  */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Header: Title + Live indicator with small pulsing green dot */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            Payment modes
          </h3>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B5D45]"></span>
            </span>
            <span>Live</span>
          </div>
        </div>

        {/* Donut Chart Visual */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={donutRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-slate-100 dark:text-slate-800"
              />
              {txSum > 0 && (() => {
                let cumulative = 0;
                return paymentModes.map((mode) => {
                  const fraction = mode.amount / txSum;
                  if (fraction <= 0) return null;
                  const dash = fraction * donutCircumference;
                  const offset = -cumulative * donutCircumference;
                  cumulative += fraction;
                  return (
                    <circle
                      key={mode.id}
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="none"
                      stroke={mode.color}
                      strokeWidth="9"
                      strokeDasharray={`${dash} ${donutCircumference}`}
                      strokeDashoffset={offset}
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {txSum > 0 ? 'Total' : 'Settled'}
              </span>
              <span className="font-numbers font-bold text-xs text-[#0B5D45] dark:text-emerald-400">
                {txSum > 0 ? '100%' : '₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* Donut Legend with Calculated Rupee Amounts & Tx Counts (if > 0) */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {paymentModes.map((mode) => (
            <div key={mode.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: mode.color }}
                />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {mode.name}
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  {mode.percent}%
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-numbers font-bold text-slate-900 dark:text-white">
                  ₹{mode.amount.toLocaleString('en-IN')}
                </span>
                {mode.txCount > 0 && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5 font-mono">
                    ({mode.txCount} Txs)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button: Review Gateway Settlement Ledger */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onNavigate('reconciliation')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
          >
            <span>Review Gateway Settlement Ledger</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. VERIFIED LIVE FEE COLLECTION STREAM (MOBILE CARDS)    */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Fee collection stream
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verified collections updated in ERP ledger.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cashier')}
            className="min-h-[44px] text-xs text-[#0B5D45] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Treasury counter ›
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-white truncate">
                  {tx.studentName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                  {tx.rollNo} · {tx.paymentMethod}
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2">
                <div className="font-numbers font-bold text-slate-900 dark:text-white">
                  ₹{tx.amount.toLocaleString('en-IN')}
                </div>
                <button
                  type="button"
                  onClick={() => onViewReceipt(tx)}
                  className="min-h-[44px] px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D45] dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                  title="View and print official fee receipt"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
