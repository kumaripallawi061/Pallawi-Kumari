import React, { useState } from 'react';
import {
  StudentDue,
  PaymentProviderConfig,
  CampaignPayment,
  PaymentMethodType,
} from '../../types/campaign';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Lock,
  ArrowRight,
  Download,
  Share2,
  Printer,
  ChevronDown,
  ChevronUp,
  Clock,
  Building,
} from 'lucide-react';

interface Props {
  due: StudentDue;
  activeProvider: PaymentProviderConfig | null;
  onPaymentSuccess: (payment: CampaignPayment, updatedDue: StudentDue) => void;
  onClose: () => void;
  onViewReceipt?: (payment: CampaignPayment) => void;
}

export const PaymentModalSheet: React.FC<Props> = ({
  due,
  activeProvider,
  onPaymentSuccess,
  onClose,
  onViewReceipt,
}) => {
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState<number>(
    Math.min(5000, due.balanceAmount)
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('UPI');
  const [upiIdInput, setUpiIdInput] = useState('student@okaxis');

  // Flow State: 'idle' | 'processing' | 'success' | 'failed' | 'pending'
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed' | 'pending'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    `IDEMP-${due.id}-${Date.now()}`
  );
  const [completedPayment, setCompletedPayment] = useState<CampaignPayment | null>(null);
  const [showLineItems, setShowLineItems] = useState(false);

  // Compute final payable amount
  const basePayable = paymentType === 'FULL' ? due.balanceAmount : Math.min(due.balanceAmount, Math.max(1, partialAmount));
  const lateFeeAmount = due.lateFeeApplied || 0;
  const totalPayableAmount = basePayable + (paymentType === 'FULL' ? lateFeeAmount : 0);

  // Execute Payment Simulation
  const handleExecutePayment = () => {
    if (!activeProvider || activeProvider.status !== 'Active') {
      setErrorMessage('Online payment unavailable. Contact accounts office.');
      return;
    }

    setPaymentState('processing');
    setErrorMessage(null);

    // Simulate gateway API call with active provider
    setTimeout(() => {
      // 95% success simulation
      const isSuccess = true;

      if (isSuccess) {
        const now = new Date().toISOString();
        const receiptNo = `REC/CMP/2026/${Math.floor(10000 + Math.random() * 90000)}`;
        const txId = `tx_${(activeProvider.type || 'sbi').toLowerCase().slice(0, 3)}_${Date.now()}`;
        const gatewayRef = `UPI/${Math.floor(600000000000 + Math.random() * 399999999999)}`;

        const newBalance = Math.max(0, due.balanceAmount - basePayable);
        const updatedStatus = newBalance === 0 ? 'Paid' : 'Partial';

        const paymentRecord: CampaignPayment = {
          id: `PAY-${Date.now()}`,
          receiptNo,
          dueId: due.id,
          campaignId: due.campaignId,
          campaignTitle: due.campaignTitle,
          rollNo: due.rollNo,
          studentName: due.studentName,
          course: due.course,
          semester: due.semester,
          amountPaid: totalPayableAmount,
          lateFeePaid: paymentType === 'FULL' ? lateFeeAmount : 0,
          balanceRemaining: newBalance,
          lineItems: due.lineItems,
          paymentMode: 'Online Gateway',
          methodDetail: `${selectedMethod} (${selectedMethod === 'UPI' ? upiIdInput : 'NetBanking'})`,
          providerId: activeProvider.id,
          providerName: activeProvider.name,
          providerType: activeProvider.type,
          providerMode: activeProvider.mode,
          transactionId: txId,
          gatewayReference: gatewayRef,
          idempotencyKey,
          status: 'Success',
          timestamp: now,
        };

        const updatedDue: StudentDue = {
          ...due,
          paidAmount: due.paidAmount + basePayable,
          balanceAmount: newBalance,
          lateFeeApplied: paymentType === 'FULL' ? 0 : due.lateFeeApplied,
          status: updatedStatus,
          lastPaymentDate: now.split('T')[0],
          paymentLinkActive: newBalance > 0,
          updatedAt: now,
        };

        setCompletedPayment(paymentRecord);
        setPaymentState('success');
        onPaymentSuccess(paymentRecord, updatedDue);
      } else {
        setPaymentState('failed');
        setErrorMessage('Transaction declined by your bank. You can retry safely without duplicate charges.');
      }
    }, 1500);
  };

  const handleRetry = () => {
    // Retain idempotency key or regenerate if user explicitly retries
    setPaymentState('idle');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">Secure Fee Checkout</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {due.rollNo} · {due.studentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* SUCCESS STATE */}
          {paymentState === 'success' && completedPayment && (
            <div className="text-center py-4 space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-600">
                ₹{completedPayment.amountPaid.toLocaleString('en-IN')} deposited for {due.campaignTitle}.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <strong className="text-slate-900">{completedPayment.receiptNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tx ID:</span>
                  <span className="text-slate-700">{completedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance Left:</span>
                  <span className={completedPayment.balanceRemaining === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    ₹{completedPayment.balanceRemaining.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onViewReceipt) onViewReceipt(completedPayment);
                    onClose();
                  }}
                  className="min-h-[44px] w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Preview & Download Official PDF Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* FAILED STATE */}
          {paymentState === 'failed' && (
            <div className="text-center py-4 space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Payment Failed</h4>
              <p className="text-xs text-rose-700">{errorMessage || 'Your payment was declined.'}</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                Your account was not debited. Idempotency protection ensures no duplicate charges occur.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="min-h-[44px] flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Payment</span>
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {paymentState === 'processing' && (
            <div className="text-center py-8 space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Processing Payment...</h4>
              <p className="text-xs text-slate-500">
                Authorizing with institutional aggregator. Please do not refresh or tap back.
              </p>
            </div>
          )}

          {/* IDLE / FORM STATE */}
          {paymentState === 'idle' && (
            <div className="space-y-4">
              {/* Campaign Title & Collapsible Line Items */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{due.campaignTitle}</h4>
                    <span className="text-[10px] text-slate-500">Academic Term Dues</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLineItems(!showLineItems)}
                    className="min-h-[36px] px-2 py-1 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showLineItems ? 'Hide Items' : 'View Breakdown'}</span>
                    {showLineItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showLineItems && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px] animate-in fade-in duration-150">
                    {due.lineItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                    {due.concessionAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Institutional Concession / Waiver</span>
                        <span className="font-mono">-₹{due.concessionAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Late Fee Notice if applicable */}
                {lateFeeAmount > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex justify-between items-center">
                    <span>Late fee applied ({due.lateFeeReason || 'Window closed'})</span>
                    <strong className="font-mono">+₹{lateFeeAmount.toLocaleString('en-IN')}</strong>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600">Total Outstanding Balance:</span>
                  <span className="text-sm font-black font-mono text-indigo-950">
                    ₹{(due.balanceAmount + lateFeeAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Full vs Partial Option */}
              <div className="space-y-1.5">
                <label className="text-slate-800 font-bold block">Payment Amount Choice</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('FULL')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentType === 'FULL'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">Full Clearance</div>
                    <div className="text-[11px] font-mono text-indigo-700">
                      ₹{(due.balanceAmount + lateFeeAmount).toLocaleString('en-IN')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('PARTIAL')}
                    className={`min-h-[44px] p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentType === 'PARTIAL'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">Partial Installment</div>
                    <div className="text-[11px] text-slate-500">Custom amount</div>
                  </button>
                </div>

                {paymentType === 'PARTIAL' && (
                  <div className="pt-2">
                    <label className="text-slate-700 text-[11px] font-semibold block mb-1">
                      Enter partial amount (Min ₹100, Max ₹{due.balanceAmount})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min={100}
                        max={due.balanceAmount}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(Math.min(due.balanceAmount, Number(e.target.value)))}
                        className="w-full min-h-[44px] pl-8 pr-3 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <label className="text-slate-800 font-bold block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR' },
                    { id: 'Card', label: 'Debit/Credit' },
                    { id: 'NetBanking', label: 'NetBanking' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as PaymentMethodType)}
                      className={`min-h-[40px] p-2 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                        selectedMethod === m.id
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {selectedMethod === 'UPI' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      className="w-full min-h-[40px] p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Active Provider Status or Coming Soon Banner */}
              {(!activeProvider || activeProvider.status !== 'Active') ? (
                /* ONLINE PAYMENT SERVICE COMING SOON BANNER */
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-amber-950 space-y-2.5 text-left">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-amber-200 border border-amber-300 text-amber-900 rounded font-bold text-[9px] uppercase tracking-wider">
                          Coming Soon
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          Online Payment Gateway Service Coming Soon
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        The institutional payment gateway is currently being mapped by college administration.
                      </p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/80 border border-amber-200 rounded-lg text-[10px] text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Please deposit fees directly at the <strong>College Accounts Desk (Ground Floor)</strong>.</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Live Provider Indicator */}
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">Live Gateway: {activeProvider.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-800 font-bold">
                      {activeProvider.mode}
                    </span>
                  </div>

                  {/* Primary Pay Button */}
                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    className="w-full min-h-[48px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-indigo-200" />
                    <span>Pay ₹{totalPayableAmount.toLocaleString('en-IN')} Now</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
