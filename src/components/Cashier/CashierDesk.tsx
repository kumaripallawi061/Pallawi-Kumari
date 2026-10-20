import React, { useState } from 'react';
import { Student, FeeTransaction } from '../../types/fee';
import { 
  Building2, 
  Search, 
  Receipt, 
  Coins, 
  CreditCard, 
  FileCheck, 
  Printer, 
  Check, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { PrintableReceipt } from '../Common/PrintableReceipt';
import { safeLower } from '../../utils/safeHelpers';

interface Props {
  students: Student[];
  onCashierPayment: (transaction: FeeTransaction, updatedStudent: Student) => void;
}

export const CashierDesk: React.FC<Props> = ({ students, onCashierPayment }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cashierMode, setCashierMode] = useState<'cash' | 'dd' | 'pos' | 'challan'>('dd');
  
  // Cash denomination counter
  const [notes500, setNotes500] = useState<number>(0);
  const [notes200, setNotes200] = useState<number>(0);
  const [notes100, setNotes100] = useState<number>(0);
  const [notes50, setNotes50] = useState<number>(0);

  // DD / Cheque fields
  const [ddNumber, setDdNumber] = useState<string>('DD-SBI-991204');
  const [bankName, setBankName] = useState<string>('State Bank of India');
  const [ddBranch, setDdBranch] = useState<string>('Patna Secretariat Branch');
  const [ddDate, setDdDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // POS / Card Swipe
  const [posRrn, setPosRrn] = useState<string>('POS-PINELABS-449120');

  // Manual payment amount
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0] || null;
  const totalDue = currentStudent ? currentStudent.pendingFee + currentStudent.lateFineApplied : 0;
  const [amountToCollect, setAmountToCollect] = useState<number>(totalDue > 0 ? totalDue : 0);

  // Active cashier drawer
  const [cashierRegisterTotal, setCashierRegisterTotal] = useState<number>(0);
  const [recentCashierTx, setRecentCashierTx] = useState<FeeTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [shiftClosed, setShiftClosed] = useState<boolean>(false);

  const calculatedCashTotal = (notes500 * 500) + (notes200 * 200) + (notes100 * 100) + (notes50 * 50);

  const handleProcessCounterPayment = () => {
    if (!currentStudent || amountToCollect <= 0 || shiftClosed) return;

    const receiptNo = `REC/COUNTER/${Date.now().toString().slice(-6)}`;
    const txId = `TX-CNTR-${Date.now().toString().slice(-5)}`;
    
    let method: FeeTransaction['paymentMethod'] = 'Cash';
    let gatewayRef = 'Desk-02 Cash Register';
    let bankRef = 'INR-CASH-VAULT';

    if (cashierMode === 'dd') {
      method = 'Demand Draft';
      gatewayRef = `${bankName} DD #${ddNumber}`;
      bankRef = `DD-BR-${ddBranch.slice(0, 8)}`;
    } else if (cashierMode === 'pos') {
      method = 'POS';
      gatewayRef = `HDFC POS Terminal #04`;
      bankRef = posRrn;
    } else if (cashierMode === 'challan') {
      method = 'Challan';
      gatewayRef = `SBI Counter e-Challan`;
      bankRef = `CHLN-${Date.now().toString().slice(-7)}`;
    }

    const newTx: FeeTransaction = {
      id: txId,
      receiptNo,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentEmail: currentStudent.email || '',
      rollNo: currentStudent.rollNo,
      course: `${currentStudent.course} ${currentStudent.branch} - Sem ${currentStudent.semester}`,
      semester: currentStudent.semester,
      amount: amountToCollect,
      lateFineIncluded: Math.min(currentStudent.lateFineApplied, amountToCollect),
      discountApplied: 0,
      paymentMethod: method,
      gateway: 'Counter Cash',
      gatewayTransactionId: gatewayRef,
      bankUtr: bankRef,
      timestamp: new Date().toISOString(),
      status: 'Success',
      cashierName: 'Sunita Mehra (Counter Desk 2)',
      remarks: cashierMode === 'dd' ? `DD in favor of ${currentStudent.course} Trust, Bank: ${bankName}` : 'Counter Walk-in Clearance',
      headsAllocated: [
        { headName: 'Academic Tuition & Exam Clearance', amount: amountToCollect },
      ],
    };

    const lateFineDeduction = Math.min(currentStudent.lateFineApplied || 0, amountToCollect);
    const feeDeduction = amountToCollect - lateFineDeduction;
    const newLateFine = Math.max(0, (currentStudent.lateFineApplied || 0) - lateFineDeduction);
    const newPending = Math.max(0, currentStudent.pendingFee - feeDeduction);
    const newPaid = currentStudent.paidFee + feeDeduction;

    const updatedStudent: Student = {
      ...currentStudent,
      paidFee: newPaid,
      pendingFee: newPending,
      lateFineApplied: newLateFine,
      hallTicketBlocked: (newPending === 0 && newLateFine === 0) ? false : currentStudent.hallTicketBlocked,
    };

    setCashierRegisterTotal((prev) => prev + amountToCollect);
    setRecentCashierTx(newTx);
    setShowReceiptModal(true);
    onCashierPayment(newTx, updatedStudent);
  };

  const filtered = students.filter(
    (s) =>
      safeLower(s.name).includes(safeLower(searchQuery)) ||
      safeLower(s.rollNo).includes(safeLower(searchQuery))
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Cashier Top Banner */}
      <section className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Finance & Accounts Office Terminal</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Counter Fee Collection & Cashier Shift Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Cashier: <strong>Sunita Mehra (Senior Accountant)</strong> · Terminal #02
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Shift Total Collected</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              ₹{cashierRegisterTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            onClick={() => setShiftClosed(!shiftClosed)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              shiftClosed
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{shiftClosed ? 'Reopen Shift' : 'Close Day Shift'}</span>
          </button>
        </div>
      </section>

      {/* Main Cashier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Student Selector & Counter Verification (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Step 1: Student Lookup (Roll No / Reg No)
            </label>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Type Roll No e.g. 2023EC204..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-100 rounded-lg">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setAmountToCollect(s.pendingFee + s.lateFineApplied);
                  }}
                  className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    s.id === selectedStudentId ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{s.rollNo} · {s.branch}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(s.pendingFee + s.lateFineApplied).toLocaleString('en-IN')}
                    </span>
                    <span className={`block text-[10px] ${s.pendingFee === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {s.pendingFee === 0 ? 'Cleared' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Dues Review */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Active Student Record
            </span>
            {currentStudent ? (
              <>
                <h4 className="text-base font-bold text-slate-900">{currentStudent.name}</h4>
                <p className="text-xs text-slate-500">
                  {currentStudent.rollNo} · {currentStudent.course} ({currentStudent.quota} Quota)
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Academic Dues:</span>
                    <span className="font-mono font-semibold text-slate-900">₹{currentStudent.pendingFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accumulated Late Fine:</span>
                    <span className="font-mono font-semibold text-amber-700">₹{currentStudent.lateFineApplied.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                    <span>Total Net Outstanding:</span>
                    <span className="font-mono text-rose-700 text-sm">₹{totalDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 py-3">No student record selected. Enroll students or search by roll number.</p>
            )}
          </div>
        </div>

        {/* Right: Counter Payment Formulation (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Collect Payment & Issue Receipt</h3>
              <p className="text-xs text-slate-500">Select counter tender type and enter instrument details.</p>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setCashierMode('dd')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  cashierMode === 'dd'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Demand Draft / Cheque
              </button>

              <button
                onClick={() => setCashierMode('cash')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  cashierMode === 'cash'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Physical Cash
              </button>

              <button
                onClick={() => setCashierMode('pos')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  cashierMode === 'pos'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                POS Card Swipe
              </button>

              <button
                onClick={() => setCashierMode('challan')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  cashierMode === 'challan'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bank e-Challan
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Amount Being Paid at Counter (₹)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={amountToCollect}
                  onChange={(e) => setAmountToCollect(Number(e.target.value))}
                  className="w-full p-2.5 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setAmountToCollect(totalDue)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg whitespace-nowrap"
                >
                  Full Due (₹{totalDue.toLocaleString('en-IN')})
                </button>
              </div>
            </div>

            {/* DD / Cheque specific inputs */}
            {cashierMode === 'dd' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">DD / Cheque Number *</label>
                    <input
                      type="text"
                      value={ddNumber}
                      onChange={(e) => setDdNumber(e.target.value)}
                      placeholder="e.g. 991204"
                      className="w-full p-2 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">Issuing Bank *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full p-2 bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">Bank Branch</label>
                    <input
                      type="text"
                      value={ddBranch}
                      onChange={(e) => setDdBranch(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-medium">DD Issue Date</label>
                    <input
                      type="date"
                      value={ddDate}
                      onChange={(e) => setDdDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Physical Cash Denomination Counter */}
            {cashierMode === 'cash' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-800">Cash Currency Denomination Tally</span>
                  <span className="font-mono font-bold text-indigo-700">
                    Calculated: ₹{calculatedCashTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white p-2 rounded border border-slate-200 text-center">
                    <span className="font-bold text-slate-800 block">₹500 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={notes500}
                      onChange={(e) => setNotes500(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-center font-mono mt-1"
                    />
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-center">
                    <span className="font-bold text-slate-800 block">₹200 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={notes200}
                      onChange={(e) => setNotes200(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-center font-mono mt-1"
                    />
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-center">
                    <span className="font-bold text-slate-800 block">₹100 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={notes100}
                      onChange={(e) => setNotes100(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-center font-mono mt-1"
                    />
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200 text-center">
                    <span className="font-bold text-slate-800 block">₹50 ×</span>
                    <input
                      type="number"
                      min="0"
                      value={notes50}
                      onChange={(e) => setNotes50(Number(e.target.value))}
                      className="w-16 p-1 border rounded text-center font-mono mt-1"
                    />
                  </div>
                </div>

                {calculatedCashTotal !== amountToCollect && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Denomination sum (₹{calculatedCashTotal}) does not match collect amount (₹{amountToCollect}).</span>
                  </p>
                )}
              </div>
            )}

            {/* POS card swipe */}
            {cashierMode === 'pos' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <label className="text-slate-600 block font-medium">POS Terminal Retrieval Reference Number (RRN)</label>
                <input
                  type="text"
                  value={posRrn}
                  onChange={(e) => setPosRrn(e.target.value)}
                  placeholder="e.g. POS-PINELABS-449120"
                  className="w-full p-2 bg-white border border-slate-300 rounded font-mono"
                />
                <p className="text-[11px] text-slate-500">Ensure merchant copy of slip is stapled to counter voucher.</p>
              </div>
            )}

            {/* Submit Counter Transaction */}
            <div className="pt-2">
              <button
                onClick={handleProcessCounterPayment}
                disabled={shiftClosed || amountToCollect <= 0 || (totalDue > 0 && amountToCollect > totalDue) || (cashierMode === 'cash' && calculatedCashTotal !== amountToCollect)}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Issue & Print Official Stamped Receipt (₹{amountToCollect.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Receipt Modal */}
      {showReceiptModal && recentCashierTx && (
        <PrintableReceipt
          transaction={recentCashierTx}
          student={currentStudent}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
