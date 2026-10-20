import React, { useState } from 'react';
import {
  StudentDue,
  FeeCampaign,
  PaymentProviderConfig,
  CampaignPayment,
} from '../../types/campaign';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
  Sparkles,
  Lock,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PaymentModalSheet } from './PaymentModalSheet';
import { safeMatchStrings } from '../../utils/safeHelpers';

interface Props {
  studentRollNo: string;
  studentDues: StudentDue[];
  campaigns: FeeCampaign[];
  activeProvider: PaymentProviderConfig | null;
  onPaymentSuccess: (payment: CampaignPayment, updatedDue: StudentDue) => void;
  onViewReceipt: (payment: CampaignPayment) => void;
  payments: CampaignPayment[];
}

export const StudentMyFees: React.FC<Props> = ({
  studentRollNo,
  studentDues,
  campaigns,
  activeProvider,
  onPaymentSuccess,
  onViewReceipt,
  payments,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [activeDueForPayment, setActiveDueForPayment] = useState<StudentDue | null>(null);
  const [expandedDueIds, setExpandedDueIds] = useState<Set<string>>(new Set());

  // Filter dues strictly tied to student's Roll No
  const myDues = studentDues.filter(
    (d) => safeMatchStrings(d.rollNo, studentRollNo)
  );

  const toggleExpand = (dueId: string) => {
    const next = new Set(expandedDueIds);
    if (next.has(dueId)) next.delete(dueId);
    else next.add(dueId);
    setExpandedDueIds(next);
  };

  // Helper to compute countdown text
  const getCountdownText = (endDateStr: string): { text: string; isPast: boolean } => {
    const now = new Date();
    const end = new Date(endDateStr);
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Expired', isPast: true };
    if (diffDays === 0) return { text: 'Due Today', isPast: false };
    if (diffDays === 1) return { text: '1 day left', isPast: false };
    return { text: `${diffDays} days left`, isPast: false };
  };

  // Group into Tabs
  const pendingDues = myDues.filter((d) => {
    const camp = campaigns.find((c) => c.id === d.campaignId);
    const isExpired = camp && !camp.hasNoEndDate && camp.endDate ? new Date() > new Date(camp.endDate) : false;
    return !isExpired && (d.status === 'Pending' || d.status === 'Partial');
  });

  const paidDues = myDues.filter((d) => d.status === 'Paid');

  const expiredDues = myDues.filter((d) => {
    const camp = campaigns.find((c) => c.id === d.campaignId);
    const isExpired = camp && !camp.hasNoEndDate && camp.endDate ? new Date() > new Date(camp.endDate) : false;
    return (isExpired || d.status === 'Expired' || d.status === 'Overdue') && d.status !== 'Paid';
  });

  const currentList =
    activeTab === 'pending' ? pendingDues : activeTab === 'paid' ? paidDues : expiredDues;

  return (
    <div className="space-y-4">
      {/* Top Banner Notice - Unified Fee Module & Payments */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Fee Module & Online Payments</h2>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Integrated Fee & Dues Desk
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Showing statutory term dues, fee campaigns and verified receipts for Roll No: <strong className="text-slate-800 font-mono">{studentRollNo}</strong>
        </p>
      </div>

      {/* Tabs: Pending, Paid, Expired */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-indigo-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Pending Fees</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'pending' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingDues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paid')}
          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'paid'
              ? 'bg-white text-emerald-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Paid ({paidDues.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expired')}
          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-white text-rose-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Expired ({expiredDues.length})</span>
        </button>
      </div>

      {/* List of Campaign Cards (Mobile-first, never merged) */}
      {currentList.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {activeTab === 'pending'
              ? "No fees due. You're all caught up."
              : activeTab === 'paid'
              ? 'No completed payments yet.'
              : 'No expired fee windows.'}
          </h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'pending'
              ? 'All current term statutory fees and campus dues are settled.'
              : 'Past receipt records will appear here once processed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((due) => {
            const camp = campaigns.find((c) => c.id === due.campaignId);
            const isExpanded = expandedDueIds.has(due.id);
            const endDate = camp?.endDate || due.createdAt;
            const countdown = getCountdownText(endDate);
            const isExtended = Boolean(camp && camp.extensions.length > 0);

            // Find matching receipt for paid dues
            const matchedReceipt = payments.find(
              (p) => p.dueId === due.id && p.status === 'Success'
            );

            return (
              <div
                key={due.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 transition-all"
              >
                {/* Header: Title, Status, Extension tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        due.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : due.status === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : activeTab === 'expired'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {activeTab === 'expired' ? 'Expired' : due.status}
                      </span>

                      {isExtended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Extended till {new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {due.campaignTitle}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Roll No: {due.rollNo}
                    </span>
                  </div>

                  {/* Countdown Badge */}
                  <div className="text-right shrink-0">
                    <span className={`text-[11px] font-bold block ${
                      countdown.isPast ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {countdown.text}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {new Date(endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Amounts Breakdown Card */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Base Term Fee:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{due.baseAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {due.concessionAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold text-[11px]">
                      <span>Concession / Scholarship:</span>
                      <span className="font-mono">-₹{due.concessionAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {due.paidAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Amount Paid So Far:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{due.paidAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {due.lateFeeApplied > 0 && (
                    <div className="flex justify-between items-center text-amber-900 font-semibold text-[11px] bg-amber-50 p-1.5 rounded">
                      <span>Late Fee Surcharge:</span>
                      <span className="font-mono">+₹{due.lateFeeApplied.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Outstanding Balance:</span>
                    <span className="text-base font-black font-mono text-indigo-950">
                      ₹{(due.balanceAmount + (due.lateFeeApplied || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Collapsible Line Items */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(due.id)}
                    className="min-h-[36px] w-full py-1 text-slate-600 text-xs font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>Itemized Fee Breakdown ({due.lineItems.length} heads)</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="p-2.5 bg-slate-50/70 rounded-xl space-y-1 text-[11px] animate-in fade-in duration-150">
                      {due.lineItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-slate-600">
                          <span>{item.name}</span>
                          <span className="font-mono font-semibold text-slate-800">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Paid State: Download / Preview Receipt */}
                  {due.status === 'Paid' ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (matchedReceipt) onViewReceipt(matchedReceipt);
                        }}
                        className="min-h-[44px] flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-emerald-100" />
                        <span>Preview & Download PDF</span>
                      </button>
                    </div>
                  ) : activeTab === 'expired' ? (
                    /* Expired State: Disabled button */
                    <button
                      type="button"
                      disabled
                      className="min-h-[44px] w-full px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Fee Window Closed · Contact Accounts Office</span>
                    </button>
                  ) : (
                    /* Active Pending State: Primary Pay Button */
                    <button
                      type="button"
                      onClick={() => setActiveDueForPayment(due)}
                      className="min-h-[48px] w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-indigo-200" />
                      <span>Pay ₹{(due.balanceAmount + (due.lateFeeApplied || 0)).toLocaleString('en-IN')} Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PAYMENT SHEET */}
      {activeDueForPayment && (
        <PaymentModalSheet
          due={activeDueForPayment}
          activeProvider={activeProvider}
          onPaymentSuccess={(p, updatedDue) => {
            onPaymentSuccess(p, updatedDue);
          }}
          onClose={() => setActiveDueForPayment(null)}
          onViewReceipt={onViewReceipt}
        />
      )}
    </div>
  );
};
