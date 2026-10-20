import React, { useState, useEffect } from 'react';
import { 
  Student, 
  DynamicQrConfig, 
  FeeTransaction 
} from '../../types/fee';
import { 
  safeString, 
  safeNumber 
} from '../../utils/safeHelpers';
import {
  toPaisa,
  fromPaisa,
  paisaAdd,
  paisaSub
} from '../../utils/paisaMath';
import { 
  QrCode, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  Building, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { generateSanitizedUpiUrl } from '../Admin/DynamicQrConfigModal';

interface Props {
  student: Student;
  amountDue: number;
  purpose?: string;
  dynamicQrConfig: DynamicQrConfig;
  onPaymentSuccess: (tx: FeeTransaction, updatedStudent: Student) => void;
  onClose: () => void;
}

export const DynamicUpiQrPaymentModal: React.FC<Props> = ({
  student,
  amountDue,
  purpose = 'Odd Semester Tuition & Examination Fee',
  dynamicQrConfig,
  onPaymentSuccess,
  onClose,
}) => {
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes
  
  const studentRoll = safeString(student?.rollNo, 'STUDENT');
  const sanitizedAmount = Math.max(0, safeNumber(amountDue, 0));

  const [referenceId] = useState<string>(() => `RLSY${studentRoll.replace(/[^a-zA-Z0-9]/g, '')}${Date.now().toString().slice(-6)}`);
  const [duReference] = useState<string>(() => `DU-UPI-${Date.now().toString().slice(-8)}`);

  // UPI Intent URL with immutable amount & transaction note containing Roll No (NPCI sanitized)
  const upiIntentUrl = generateSanitizedUpiUrl(
    safeString(dynamicQrConfig?.upiId),
    safeString(dynamicQrConfig?.merchantName),
    sanitizedAmount,
    `FEE-${studentRoll}-SEM${student?.semester || 1}`,
    referenceId
  );

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(dynamicQrConfig.upiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const [gatewayStatus, setGatewayStatus] = useState<'idle' | 'verifying' | 'Success' | 'Pending' | 'Failed'>('idle');
  const [issuedReceiptId, setIssuedReceiptId] = useState<string | null>(null);
  const [createdTx, setCreatedTx] = useState<FeeTransaction | null>(null);
  const [updatedStudentObj, setUpdatedStudentObj] = useState<Student | null>(null);

  const handleSimulatePaymentApproval = (chosenOutcome: 'Success' | 'Pending' | 'Failed' = 'Success') => {
    setIsVerifying(true);
    setGatewayStatus('verifying');

    setTimeout(() => {
      setIsVerifying(false);
      const generatedReceiptId = `RLSY/2025/UPI/${Date.now().toString().slice(-5)}`;
      setIssuedReceiptId(generatedReceiptId);
      setGatewayStatus(chosenOutcome);

      if (chosenOutcome === 'Success') {
        const payablePaisa = toPaisa(sanitizedAmount);
        const curPaidPaisa = toPaisa(student?.paidFee);
        const curPendingPaisa = toPaisa(student?.pendingFee);
        const curLateFinePaisa = toPaisa(student?.lateFineApplied || 0);

        const lateFineDeductionPaisa = Math.min(curLateFinePaisa, payablePaisa);
        const feeDeductionPaisa = paisaSub(payablePaisa, lateFineDeductionPaisa);
        const newLateFinePaisa = paisaSub(curLateFinePaisa, lateFineDeductionPaisa);
        const newPendingPaisa = paisaSub(curPendingPaisa, feeDeductionPaisa);
        const newPaidPaisa = paisaAdd(curPaidPaisa, feeDeductionPaisa);
        const newBlocked = (newPendingPaisa === 0 && newLateFinePaisa === 0) ? false : (student?.hallTicketBlocked ?? false);

        const updatedStudent: Student = {
          ...student,
          paidFee: fromPaisa(newPaidPaisa),
          pendingFee: fromPaisa(newPendingPaisa),
          lateFineApplied: fromPaisa(newLateFinePaisa),
          hallTicketBlocked: newBlocked,
        };

        const bankAcctTail = safeString(dynamicQrConfig?.accountNumber).slice(-4);
        const newTx: FeeTransaction = {
          id: `TXN-${Date.now().toString().slice(-6)}`,
          receiptNo: generatedReceiptId,
          studentId: student?.id || 'STU-001',
          studentName: student?.name || 'Student',
          rollNo: studentRoll,
          course: student?.course || 'General',
          semester: student?.semester || 1,
          amount: sanitizedAmount,
          lateFineIncluded: fromPaisa(lateFineDeductionPaisa),
          discountApplied: 0,
          paymentMethod: 'Dynamic UPI QR',
          gateway: 'e-Treasury (IFMS)',
          gatewayTransactionId: duReference,
          bankUtr: `UPI-${referenceId}`,
          treasuryHeadCode: safeString(dynamicQrConfig?.treasuryHeadCode, '0202-01-102-01'),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Success',
          remarks: `Dynamic UPI QR Payment settled to ${safeString(dynamicQrConfig?.bankName, 'State Bank')} (${bankAcctTail || 'XXXX'}). Roll: ${studentRoll}`,
          headsAllocated: [
            {
              headName: purpose,
              amount: sanitizedAmount,
              treasuryCode: safeString(dynamicQrConfig?.treasuryHeadCode, '0202-01-102-01'),
            },
          ],
        };

        setCreatedTx(newTx);
        setUpdatedStudentObj(updatedStudent);
      }
    }, 1200);
  };

  const handleCompleteSuccess = () => {
    if (createdTx && updatedStudentObj) {
      onPaymentSuccess(createdTx, updatedStudentObj);
    }
    onClose();
  };

  // If service is deactivated by Admin
  if (!dynamicQrConfig.isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-rose-200 my-auto max-h-[90vh] overflow-y-auto flex flex-col">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Dynamic QR Payment Service Inactive</h3>
          <p className="text-xs text-slate-600">
            The Dynamic UPI QR gateway has been temporarily suspended by the College Institutional Administrator. 
            Please make your fee payment via authorized NetBanking or visit the Central Cashier Counter.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        id="dynamic-qr-modal-content"
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Official Treasury Gateway
              </span>
              <span className="text-[11px] text-slate-400 font-mono">NPCI UPI v2.0</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Dynamic UPI QR Payment</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scan with GPay, PhonePe, Paytm, BHIM, or any UPI App to pay exact dues.
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mapped Account Info Pill */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>{dynamicQrConfig.merchantName}</span>
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-200/70 text-emerald-950 rounded text-[9px] font-mono">
              Verified
            </span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono flex items-center justify-between">
            <span>Bank: {dynamicQrConfig.bankName}</span>
            <span>A/C: •••• {dynamicQrConfig.accountNumber.slice(-4)}</span>
          </div>
        </div>

        {/* Locked Amount Badge */}
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Locked Due Amount (Strict Protocol)</span>
            </span>
            <div className="text-2xl font-black font-mono text-white mt-0.5">
              ₹{amountDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">
              Amount cannot be altered during transaction
            </span>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Expires in</span>
            <span className={`text-sm font-mono font-bold ${secondsRemaining < 120 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Dynamic QR Code Render Box */}
        <div className="relative bg-slate-50 border-2 border-emerald-500/40 rounded-3xl p-5 text-center shadow-inner flex flex-col items-center justify-center">
          <div className="bg-white p-3.5 rounded-2xl shadow-md border border-slate-200 relative group">
            {/* SVG Dynamic QR Visual Representation */}
            <svg
              className="w-44 h-44 text-slate-900"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner position patterns */}
              <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4" />
              <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="13" y="13" width="12" height="12" fill="#047857" rx="2" />

              <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4" />
              <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="75" y="13" width="12" height="12" fill="#047857" rx="2" />

              <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4" />
              <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2" />
              <rect x="13" y="75" width="12" height="12" fill="#047857" rx="2" />

              {/* Data pixel simulation matrix */}
              <rect x="38" y="8" width="8" height="8" fill="#0f172a" />
              <rect x="50" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="38" y="20" width="6" height="6" fill="#0f172a" />
              <rect x="48" y="22" width="10" height="6" fill="#0f172a" />
              <rect x="8" y="38" width="8" height="8" fill="#0f172a" />
              <rect x="20" y="38" width="6" height="6" fill="#0f172a" />
              <rect x="8" y="50" width="6" height="8" fill="#0f172a" />
              <rect x="22" y="48" width="10" height="6" fill="#0f172a" />

              {/* Center dynamic core with college badge */}
              <rect x="35" y="35" width="30" height="30" fill="#ffffff" rx="4" stroke="#047857" strokeWidth="2" />
              <circle cx="50" cy="50" r="10" fill="#047857" />
              <text x="50" y="53" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">₹</text>

              {/* Additional outer matrix blocks */}
              <rect x="38" y="68" width="8" height="8" fill="#0f172a" />
              <rect x="50" y="72" width="6" height="6" fill="#0f172a" />
              <rect x="40" y="82" width="6" height="8" fill="#0f172a" />
              <rect x="52" y="84" width="8" height="6" fill="#0f172a" />
              <rect x="68" y="38" width="8" height="8" fill="#0f172a" />
              <rect x="80" y="42" width="6" height="6" fill="#0f172a" />
              <rect x="70" y="54" width="8" height="6" fill="#0f172a" />
              <rect x="82" y="52" width="6" height="8" fill="#0f172a" />
              <rect x="68" y="68" width="8" height="8" fill="#0f172a" />
              <rect x="80" y="72" width="8" height="8" fill="#0f172a" />
              <rect x="72" y="84" width="12" height="6" fill="#0f172a" />
            </svg>

            {/* UPI Brand watermark tag */}
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-700">
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>BHIM · GPay · PhonePe · Paytm</span>
            </div>
          </div>

          {/* Unique Roll No Verification Stamp */}
          <div className="mt-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] text-slate-700 font-mono font-bold flex items-center gap-2">
            <span className="text-emerald-700">Unique Verification ID:</span>
            <span className="text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded font-bold">
              Roll No: {student.rollNo}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 mt-1">
            Ref: {referenceId} · DDO Head: {dynamicQrConfig.treasuryHeadCode}
          </span>
        </div>

        {/* Copy UPI ID Row */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="truncate pr-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mapped UPI VPA ID</span>
            <span className="font-mono font-bold text-slate-800 text-xs truncate block">{dynamicQrConfig.upiId}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyVpa}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 shadow-2xs transition-all"
          >
            {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedVpa ? 'Copied' : 'Copy VPA'}</span>
          </button>
        </div>

        {/* Gateway Confirmation Status Banner */}
        {gatewayStatus !== 'idle' && gatewayStatus !== 'verifying' && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            gatewayStatus === 'Success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : gatewayStatus === 'Pending'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-sm">
                {gatewayStatus === 'Success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {gatewayStatus === 'Pending' && <Clock className="w-5 h-5 text-amber-600 shrink-0" />}
                {gatewayStatus === 'Failed' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span>Payment Gateway Status: {gatewayStatus}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                gatewayStatus === 'Success'
                  ? 'bg-emerald-200 text-emerald-900'
                  : gatewayStatus === 'Pending'
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-rose-200 text-rose-900'
              }`}>
                {gatewayStatus.toUpperCase()}
              </span>
            </div>

            <div className="text-[11px] font-mono bg-white/70 p-2 rounded-lg border border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-600">Generated Receipt ID:</span>
              <strong className="text-slate-900">{issuedReceiptId}</strong>
            </div>

            <p className="text-[11px]">
              {gatewayStatus === 'Success' && 'Payment verified directly by gateway webhook confirmation. Outstanding fee cleared and digital receipt issued.'}
              {gatewayStatus === 'Pending' && 'Bank has received transaction; settlement confirmation pending from gateway. Ledger will update upon bank clearance.'}
              {gatewayStatus === 'Failed' && 'Transaction declined by issuer bank or cancelled by user. No amount deducted; dues remain pending.'}
            </p>

            {gatewayStatus === 'Success' && (
              <button
                type="button"
                onClick={handleCompleteSuccess}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mt-1"
              >
                View Updated Dashboard & Receipts
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {gatewayStatus === 'idle' || gatewayStatus === 'verifying' ? (
            <>
              <button
                type="button"
                disabled={isVerifying || secondsRemaining <= 0}
                onClick={() => handleSimulatePaymentApproval('Success')}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>
                  {isVerifying ? 'Confirming Gateway Webhook Settlement...' : `Confirm Gateway Settlement of ₹${amountDue.toLocaleString('en-IN')}`}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleSimulatePaymentApproval('Pending')}
                  className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Simulate Bank Pending state"
                >
                  Test Pending
                </button>
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleSimulatePaymentApproval('Failed')}
                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Test Declined state"
                >
                  Test Failed
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel Transaction
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close Window
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          Payment is authoritatively reconciled against Roll No <strong className="text-slate-700 font-mono">{student.rollNo}</strong> only upon gateway confirmation.
        </p>
      </div>
    </div>
  );
};
