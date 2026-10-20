import React, { useState, useEffect } from 'react';
import { Student, FeeTransaction, PaymentMethod, DynamicQrConfig, StudySubject } from '../../types/fee';
import { toPaisa, fromPaisa, paisaAdd, paisaSub, paisaMulPercent, Paisa } from '../../utils/paisaMath';
import { PaymentProviderConfig } from '../../types/campaign';
import { INSTITUTION_INFO } from '../../data/mockData';
import { 
  Search, 
  CreditCard, 
  QrCode, 
  Building, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Percent, 
  Download, 
  Check, 
  Smartphone, 
  Edit3, 
  X, 
  Sliders, 
  Power, 
  Copy, 
  BookOpen 
} from 'lucide-react';
import { PrintableReceipt } from '../Common/PrintableReceipt';

interface Props {
  students: Student[];
  subjects?: StudySubject[];
  onPaymentSuccess: (transaction: FeeTransaction, updatedStudent: Student) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  dynamicQrConfig?: DynamicQrConfig;
  activeProvider?: PaymentProviderConfig | null;
  onSaveProvider?: (provider: PaymentProviderConfig | null) => void;
  userRole?: string;
}

export const StudentPaymentPortal: React.FC<Props> = ({ 
  students, 
  subjects = [],
  onPaymentSuccess, 
  onUpdateStudent,
  dynamicQrConfig,
  activeProvider = null,
  onSaveProvider,
  userRole = 'student'
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'full'>('full');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<FeeTransaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [qrTimer, setQrTimer] = useState<number>(299); // 5 min countdown for dynamic UPI QR

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0] || null;
  const activeStudent = currentStudent;

  // Student Fee Adjustment Modal states
  const [showEditFeeModal, setShowEditFeeModal] = useState<boolean>(false);
  const [editTotalFee, setEditTotalFee] = useState<number>(activeStudent?.totalFee || 0);
  const [editPendingFee, setEditPendingFee] = useState<number>(activeStudent?.pendingFee || 0);
  const [editLateFine, setEditLateFine] = useState<number>(activeStudent?.lateFineApplied || 0);
  const [editWaiverPercent, setEditWaiverPercent] = useState<number>(activeStudent?.scholarshipWaiverPercent || 0);
  const [editScholarshipName, setEditScholarshipName] = useState<string>(activeStudent?.scholarshipName || '');
  const [editHallTicketBlocked, setEditHallTicketBlocked] = useState<boolean>(activeStudent?.hallTicketBlocked || false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Structural useEffect hook listening to changes in activeStudent.id to dynamically force-sync your input state variables
  useEffect(() => {
    if (activeStudent) {
      setEditTotalFee(activeStudent.totalFee);
      setEditPendingFee(activeStudent.pendingFee);
      setEditLateFine(activeStudent.lateFineApplied);
      setEditWaiverPercent(activeStudent.scholarshipWaiverPercent);
      setEditScholarshipName(activeStudent.scholarshipName || '');
      setEditHallTicketBlocked(activeStudent.hallTicketBlocked);
      setCustomAmount(activeStudent.pendingFee + activeStudent.lateFineApplied);
    }
  }, [activeStudent?.id]);

  const handleOpenEditModal = () => {
    if (!currentStudent) return;
    setEditTotalFee(currentStudent.totalFee);
    setEditPendingFee(currentStudent.pendingFee);
    setEditLateFine(currentStudent.lateFineApplied);
    setEditWaiverPercent(currentStudent.scholarshipWaiverPercent);
    setEditScholarshipName(currentStudent.scholarshipName || '');
    setEditHallTicketBlocked(currentStudent.hallTicketBlocked);
    setSaveSuccessMsg('');
    setShowEditFeeModal(true);
  };

  const handleSaveFeeAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    const updated: Student = {
      ...currentStudent,
      totalFee: Number(editTotalFee),
      pendingFee: Number(editPendingFee),
      lateFineApplied: Number(editLateFine),
      scholarshipWaiverPercent: Number(editWaiverPercent),
      scholarshipName: editScholarshipName.trim() || undefined,
      hallTicketBlocked: editHallTicketBlocked,
    };
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    setSaveSuccessMsg('Fee details updated successfully in student ledger!');
    setTimeout(() => {
      setShowEditFeeModal(false);
      setSaveSuccessMsg('');
    }, 1000);
  };

  // Dynamic QR countdown simulation
  useEffect(() => {
    if (activePaymentMethod === 'UPI' && !completedTx) {
      const interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 299));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activePaymentMethod, completedTx]);

  // Compute payable amount based on student dues (full clearance only, no installment plans)
  const totalDueWithFine = currentStudent ? currentStudent.pendingFee + currentStudent.lateFineApplied : 0;
  const payableAmount = totalDueWithFine;

  const handleSimulatePayment = () => {
    if (!currentStudent || payableAmount <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const newTxId = 'TX-' + Math.floor(10000 + Math.random() * 90000);
      const receiptNo = `REC/SBI/25/${Math.floor(90000 + Math.random() * 10000)}`;
      const sbiDuNumber = `DU${Math.floor(10000000 + Math.random() * 90000000)}`;
      const bankUtr = `SBIN${Date.now().toString().slice(-8)}`;

      const newTx: FeeTransaction = {
        id: newTxId,
        receiptNo,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentEmail: currentStudent.email || '',
        rollNo: currentStudent.rollNo,
        course: `${currentStudent.course} ${currentStudent.branch} - Sem ${currentStudent.semester}`,
        semester: currentStudent.semester,
        amount: payableAmount,
        lateFineIncluded: Math.min(currentStudent.lateFineApplied, payableAmount),
        discountApplied: (currentStudent.totalFee * currentStudent.scholarshipWaiverPercent) / 100,
        paymentMethod: activePaymentMethod,
        gateway: activeProvider ? activeProvider.name : 'Institutional Payment Gateway',
        gatewayTransactionId: sbiDuNumber,
        bankUtr,
        treasuryHeadCode: '0202-01-102-01 (Govt Tech Ed)',
        timestamp: new Date().toISOString(),
        status: 'Success',
        headsAllocated: (() => {
          const studentSubs = (subjects || []).filter(
            (s) =>
              currentStudent.subjectsEnrolled?.includes(s.code) ||
              (s.streamCode === (currentStudent.streamCode || 'CSE') && s.semester === (currentStudent.semester || 1))
          );
          const payablePaisa: Paisa = toPaisa(payableAmount);
          if (studentSubs.length > 0) {
            const examPartPaisa = paisaMulPercent(payablePaisa, 15);
            const totalSubsPaisa = studentSubs.reduce((acc, curr) => paisaAdd(acc, toPaisa(curr.subjectFee || 3500)), 0);
            const labPartPaisa = paisaSub(payablePaisa, paisaAdd(totalSubsPaisa, examPartPaisa));
            return [
              ...studentSubs.map((sub) => ({
                headName: `${sub.code} ${sub.name} (Subject Fee)`,
                amount: fromPaisa(toPaisa(sub.subjectFee || 3500)),
                treasuryCode: '0202-01-102-01',
              })),
              { headName: 'University Exam & Tech Affiliation', amount: fromPaisa(examPartPaisa), treasuryCode: '0202-01-102-02' },
              { headName: 'Lab Maintenance & Library Book Bank', amount: fromPaisa(labPartPaisa), treasuryCode: '0202-01-102-03' },
            ];
          }
          const tuitionPaisa = paisaMulPercent(payablePaisa, 70);
          const examPaisa = paisaMulPercent(payablePaisa, 20);
          const labPaisa = paisaSub(payablePaisa, paisaAdd(tuitionPaisa, examPaisa));
          return [
            { headName: 'Enrolled Subject Course Fees (Tuition)', amount: fromPaisa(tuitionPaisa), treasuryCode: '0202-01-102-01' },
            { headName: 'State Tech University Exam & Affiliation', amount: fromPaisa(examPaisa), treasuryCode: '0202-01-102-02' },
            { headName: 'Lab Maintenance & Library Book Bank', amount: fromPaisa(labPaisa), treasuryCode: '0202-01-102-03' },
          ];
        })(),
      };

      const payablePaisa: Paisa = toPaisa(payableAmount);
      const currentPaidPaisa = toPaisa(currentStudent.paidFee);
      const currentPendingPaisa = toPaisa(currentStudent.pendingFee);
      const currentLateFinePaisa = toPaisa(currentStudent.lateFineApplied || 0);

      const lateFineDeductionPaisa = Math.min(currentLateFinePaisa, payablePaisa);
      const feeDeductionPaisa = paisaSub(payablePaisa, lateFineDeductionPaisa);
      const newLateFinePaisa = paisaSub(currentLateFinePaisa, lateFineDeductionPaisa);
      const newPendingPaisa = paisaSub(currentPendingPaisa, feeDeductionPaisa);
      const newPaidPaisa = paisaAdd(currentPaidPaisa, feeDeductionPaisa);
      const newBlocked = (newPendingPaisa === 0 && newLateFinePaisa === 0) ? false : currentStudent.hallTicketBlocked;

      const updatedStudent: Student = {
        ...currentStudent,
        paidFee: fromPaisa(newPaidPaisa),
        pendingFee: fromPaisa(newPendingPaisa),
        lateFineApplied: fromPaisa(newLateFinePaisa),
        hallTicketBlocked: newBlocked,
      };

      setIsProcessing(false);
      setCompletedTx(newTx);
      onPaymentSuccess(newTx, updatedStudent);
    }, 1200);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Student Lookup & Quick Selector */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Student / Parent Self-Service Fee Terminal
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Online Fee Payment & Instant E-Receipt Portal
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Roll No or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-56"
              />
            </div>
          </div>
        </div>

        {/* Quick Student Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 shrink-0 font-medium">Enrolled Students:</span>
          {filteredStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedStudentId(s.id);
                setCompletedTx(null);
                setCustomAmount(Math.ceil((s.pendingFee + s.lateFineApplied) / 2));
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                s.id === selectedStudentId
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{s.name} ({s.rollNo})</span>
              {s.pendingFee === 0 ? (
                <span className="text-[10px] text-emerald-200 font-bold">Paid</span>
              ) : (
                <span className={`text-[10px] ${s.id === selectedStudentId ? 'text-indigo-200' : 'text-slate-500'}`}>
                  ₹{(s.pendingFee + s.lateFineApplied).toLocaleString('en-IN')}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Main Payment & Fee Breakdown Layout */}
      {!currentStudent ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Enrolled Students in System</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Enroll students via the User & Staff Directory to collect fees and manage fee structures.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Details & Itemized Ledger (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{currentStudent.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-medium rounded">
                    {currentStudent.rollNo}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {currentStudent.course} in {currentStudent.branch} · Semester {currentStudent.semester} (Year {currentStudent.year})
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                  <span>Quota: <strong>{currentStudent.quota}</strong></span>
                  <span>·</span>
                  <span>Parent: {currentStudent.parentName}</span>
                </div>

                <div className="mt-3">
                  <button
                    onClick={handleOpenEditModal}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Modify fee structure, waiver or pending balance for this student"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Modify Fee & Waiver Details</span>
                  </button>
                </div>
              </div>

              {currentStudent.hallTicketBlocked ? (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2 text-rose-800 text-xs shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Admit Card Withheld</span>
                    <span className="text-[11px] text-rose-600">Clear dues to unblock</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2 text-emerald-800 text-xs shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Good Standing</span>
                    <span className="text-[11px] text-emerald-600">Eligible for examinations</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Ledger Summary Bar */}
            <div className="grid grid-cols-3 gap-4 pt-5">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Billed Fee</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  ₹{currentStudent.totalFee.toLocaleString('en-IN')}
                </span>
                {currentStudent.scholarshipWaiverPercent > 0 && (
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    Includes {currentStudent.scholarshipWaiverPercent}% Freeship
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Already Paid</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  ₹{currentStudent.paidFee.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Verified in ERP</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Net Pending Dues</span>
                <span className="text-base font-bold font-mono text-rose-700">
                  ₹{totalDueWithFine.toLocaleString('en-IN')}
                </span>
                {currentStudent.lateFineApplied > 0 && (
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    Incl. ₹{currentStudent.lateFineApplied} Late Fine
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Academic Heads Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Itemized Academic & Campus Fee Heads
            </h4>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2">Fee Head</th>
                  <th className="py-2">Category</th>
                  <th className="py-2 text-right">Standard Amount</th>
                  <th className="py-2 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Enrolled Subjects Fee Breakdown (Amending Tuition Fee) */}
                {(() => {
                  const studentSubs = (subjects || []).filter(
                    (s) =>
                      currentStudent.subjectsEnrolled?.includes(s.code) ||
                      (s.streamCode === (currentStudent.streamCode || 'CSE') && s.semester === (currentStudent.semester || 1))
                  );

                  if (studentSubs.length > 0) {
                    return studentSubs.map((sub) => (
                      <tr key={sub.id} className="bg-emerald-50/20">
                        <td className="py-2.5 font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-800 font-bold px-1.5 py-0.5 bg-emerald-100/60 rounded text-[10px]">
                              {sub.code}
                            </span>
                            <span>{sub.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block ml-0.5">
                            Enrolled Subject Course Fee ({sub.type.replace('_', ' ')})
                          </span>
                        </td>
                        <td className="py-2.5 text-emerald-700 font-semibold">Subject Fee (Tuition)</td>
                        <td className="py-2.5 text-right font-mono text-slate-500">₹{fromPaisa(toPaisa(sub.subjectFee || 3500)).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-emerald-800">
                          ₹{fromPaisa(paisaSub(toPaisa(sub.subjectFee || 3500), paisaMulPercent(toPaisa(sub.subjectFee || 3500), currentStudent.scholarshipWaiverPercent || 0))).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ));
                  }

                  // Default fall-back if no specific subjects configured
                  return (
                    <tr>
                      <td className="py-2.5 font-medium text-slate-900">Academic Subject & Pedagogy Dues</td>
                      <td className="py-2.5 text-slate-500">Core Subject Fees</td>
                      <td className="py-2.5 text-right font-mono text-slate-500">₹{fromPaisa(toPaisa(18000)).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                        ₹{fromPaisa(paisaSub(toPaisa(18000), paisaMulPercent(toPaisa(18000), currentStudent.scholarshipWaiverPercent || 0))).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })()}

                {/* Practical Lab & Workshop Dues */}
                {(() => {
                  const labSubs = (subjects || []).filter(
                    (s) =>
                      (currentStudent.subjectsEnrolled?.includes(s.code) ||
                      (s.streamCode === (currentStudent.streamCode || 'CSE') && s.semester === (currentStudent.semester || 1))) &&
                      s.associatedLabFee && s.associatedLabFee > 0
                  );

                  return labSubs.map((sub) => (
                    <tr key={`${sub.id}-lab`}>
                      <td className="py-2.5 font-medium text-slate-900">
                        <span className="font-mono text-blue-800 font-bold mr-1.5">{sub.code}</span>
                        <span>Lab Consumables & Workshop Equipment Fee</span>
                      </td>
                      <td className="py-2.5 text-blue-700">Lab Practice</td>
                      <td className="py-2.5 text-right font-mono text-slate-500">₹{sub.associatedLabFee?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-900">₹{sub.associatedLabFee?.toLocaleString('en-IN')}</td>
                    </tr>
                  ));
                })()}

                <tr>
                  <td className="py-2.5 font-medium text-slate-900">University Exam & Registration Fee</td>
                  <td className="py-2.5 text-slate-500">Academic Statutory</td>
                  <td className="py-2.5 text-right font-mono text-slate-500">₹6,500</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900">₹6,500</td>
                </tr>
                {currentStudent.hostelResident && (
                  <tr>
                    <td className="py-2.5 font-medium text-slate-900">Hostel & Mess Maintenance</td>
                    <td className="py-2.5 text-slate-500">Hostel Trust</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">₹50,000</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">₹50,000</td>
                  </tr>
                )}
                {currentStudent.busUser && (
                  <tr>
                    <td className="py-2.5 font-medium text-slate-900">Fleet Transport Services</td>
                    <td className="py-2.5 text-slate-500">Transport</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">₹14,000</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">₹14,000</td>
                  </tr>
                )}
                {currentStudent.lateFineApplied > 0 && (
                  <tr className="text-amber-800 bg-amber-50/50">
                    <td className="py-2.5 font-medium">Overdue Late Fine Accumulation</td>
                    <td className="py-2.5 text-amber-700">Late Surcharge</td>
                    <td className="py-2.5 text-right font-mono">₹{currentStudent.lateFineApplied}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">₹{currentStudent.lateFineApplied}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Checkout, Dynamic UPI QR, and Payment Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {totalDueWithFine <= 0 ? (
            <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">All Fees Fully Cleared!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                No outstanding fees remain for {currentStudent.name} for Semester {currentStudent.semester}.
              </p>

              <button
                onClick={() => {
                  const dummyTx: FeeTransaction = {
                    id: 'TX-FULLPAID',
                    receiptNo: 'REC/25/08/90412',
                    studentId: currentStudent.id,
                    studentName: currentStudent.name,
                    rollNo: currentStudent.rollNo,
                    course: `${currentStudent.course} - Sem ${currentStudent.semester}`,
                    semester: currentStudent.semester,
                    amount: currentStudent.paidFee,
                    lateFineIncluded: 0,
                    discountApplied: (currentStudent.totalFee * currentStudent.scholarshipWaiverPercent) / 100,
                    paymentMethod: 'UPI',
                    gateway: activeProvider ? activeProvider.name : 'Institutional Payment Gateway',
                    bankUtr: '523901994821',
                    timestamp: '2025-08-12 11:24 AM',
                    status: 'Success',
                    headsAllocated: [
                      { headName: 'Full Academic Year Clearance', amount: currentStudent.paidFee },
                    ],
                  };
                  setCompletedTx(dummyTx);
                  setShowReceiptModal(true);
                }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Cleared Fee Receipt</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h4 className="text-base font-bold text-slate-900">Fee Settlement Clearance</h4>
                <p className="text-xs text-slate-500">Government colleges mandate 100% full clearance of institutional dues per semester.</p>
              </div>

              {/* Clearance Summary Card (Installment plans disabled by institutional policy) */}
              <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Full Institutional Fee Clearance</span>
                    <span className="text-[11px] text-slate-600">Complete one-time settlement of semester fees & statutory dues</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-emerald-900">
                  ₹{totalDueWithFine.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Payment Gateway View: Coming Soon Banner OR Live Provider */}
              {(!activeProvider || activeProvider.status !== 'Active') ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-amber-950 space-y-3.5 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 shadow-2xs">
                      <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-200 border border-amber-300 text-amber-900 rounded-md font-bold text-[10px] uppercase tracking-wider">
                          Coming Soon
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          Online Payment Gateway Service Coming Soon
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        The institutional online fee payment gateway is currently undergoing integration and treasury certification by college administration. No unauthorized or third-party payment links are active.
                      </p>
                      <div className="p-2.5 bg-white/80 border border-amber-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-700" />
                          <span>Direct Treasury Cashier Counter Settlement Available</span>
                        </div>
                        <p className="text-slate-600">
                          Please deposit your term fee of <strong className="text-emerald-800">₹{payableAmount.toLocaleString('en-IN')}</strong> at the <strong>College Accounts Counter / Cashier Desk (Ground Floor)</strong>. Computerized receipts are generated instantly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Live Provider Header Badge */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Live Gateway: {activeProvider.name}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-mono">
                          Merchant ID: {activeProvider.merchantAccountId} · {activeProvider.mode} Mode
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-md">
                      Live Gateway Active
                    </span>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">
                      Select Gateway Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {activeProvider.supportUpi !== false && (
                        <button
                          onClick={() => {
                            if (dynamicQrConfig && !dynamicQrConfig.isActive) return;
                            setActivePaymentMethod('UPI');
                          }}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            dynamicQrConfig && !dynamicQrConfig.isActive
                              ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                              : activePaymentMethod === 'UPI'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                          <span className="text-xs block">Dynamic UPI</span>
                          <span className="text-[9px] text-emerald-600 font-semibold">Exact Sum Locked</span>
                        </button>
                      )}

                      {activeProvider.supportNetBanking !== false && (
                        <button
                          onClick={() => setActivePaymentMethod('NetBanking')}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            activePaymentMethod === 'NetBanking'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Building className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                          <span className="text-xs block">NetBanking</span>
                          <span className="text-[9px] text-slate-400">Direct Bank Clearing</span>
                        </button>
                      )}

                      {activeProvider.supportCards !== false && (
                        <button
                          onClick={() => setActivePaymentMethod('Card')}
                          className={`p-2.5 rounded-lg border text-center transition-all ${
                            activePaymentMethod === 'Card'
                              ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                          <span className="text-xs block">Debit/Credit</span>
                          <span className="text-[9px] text-slate-400">Visa / Master</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dynamic QR Simulation View */}
                  {activePaymentMethod === 'UPI' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Gateway Account VPA:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {activeProvider.merchantAccountId?.includes('@')
                            ? activeProvider.merchantAccountId
                            : `rlsy.fee@${(activeProvider.type || 'sbi').toLowerCase().slice(0, 3)}`}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200 text-left text-[11px] space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Beneficiary:</span>
                          <span className="font-semibold text-slate-800">{INSTITUTION_INFO.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Provider:</span>
                          <span className="font-medium text-slate-700">{activeProvider.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Student Roll:</span>
                          <span className="font-mono font-bold text-emerald-800">{currentStudent.rollNo}</span>
                        </div>
                      </div>

                      {/* QR Box */}
                      <div className="w-44 h-44 mx-auto bg-white p-2.5 border-2 border-slate-800 rounded-lg shadow-sm flex flex-col items-center justify-center relative">
                        <div className="w-full h-full bg-slate-900 rounded p-1 flex items-center justify-center">
                          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2">
                            <QrCode className="w-28 h-28 text-slate-900" />
                            <span className="text-[8px] font-mono font-bold text-slate-700 mt-1">
                              EXACT SUM LOCKED: ₹{payableAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>QR expires in: </span>
                        <span className="font-mono font-bold text-slate-800">
                          {Math.floor(qrTimer / 60)}:{('0' + (qrTimer % 60)).slice(-2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* NetBanking View */}
                  {activePaymentMethod === 'NetBanking' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <label className="text-slate-600 block font-medium">Select NetBanking Clearing Bank:</label>
                      <select className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500">
                        <option>State Bank of India (Treasury e-Pay)</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Punjab National Bank</option>
                        <option>Axis Bank</option>
                        <option>Canara Bank</option>
                      </select>
                    </div>
                  )}

                  {/* Card Simulation View */}
                  {activePaymentMethod === 'Card' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                      <input
                        type="text"
                        disabled
                        value="•••• •••• •••• 4242 (Encrypted Gateway Channel)"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-600 font-mono"
                      />
                    </div>
                  )}

                  {/* Final CTA & Confirmation - PAY NOW BUTTON */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span className="text-slate-500">Payable Amount:</span>
                      <span className="font-mono text-base font-extrabold text-slate-950">
                        ₹{payableAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Authorizing with {activeProvider.name}...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Authorize & Pay ₹{payableAmount.toLocaleString('en-IN')} Now</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Processed via {activeProvider.name} · Encrypted Gateway</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Success Card with Instant Voucher View */}
          {completedTx && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Payment Confirmed & Verified by ERP!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Transaction ID: <span className="font-mono font-semibold">{completedTx.gatewayTransactionId}</span>
                <br />
                Bank UTR: <span className="font-mono font-semibold">{completedTx.bankUtr}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Official Stamped Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Official Printable Receipt Modal */}
      {showReceiptModal && completedTx && currentStudent && (
        <PrintableReceipt
          transaction={completedTx}
          student={currentStudent}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Admin Fee & Concession Modification Modal */}
      {showEditFeeModal && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto my-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Modify Student Fee Ledger & Concessions
                </h3>
              </div>
              <button
                onClick={() => setShowEditFeeModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
              <div>
                Student: <strong className="text-slate-900">{currentStudent.name}</strong> · Roll: <span className="font-mono font-bold text-slate-800">{currentStudent.rollNo}</span>
              </div>
              <div>
                Program: {currentStudent.course} {currentStudent.branch} (Sem {currentStudent.semester})
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveFeeAdjustment} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Annual Course Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={editTotalFee}
                    onChange={(e) => setEditTotalFee(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pending Fee Dues (₹)
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={editPendingFee}
                    onChange={(e) => setEditPendingFee(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-rose-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Late Fine Penalty (₹)</label>
                    {editLateFine > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditLateFine(0)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        Waive to ₹0
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="50"
                    value={editLateFine}
                    onChange={(e) => setEditLateFine(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-semibold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Scholarship Concession %
                  </label>
                  <select
                    value={editWaiverPercent}
                    onChange={(e) => setEditWaiverPercent(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium focus:bg-white"
                  >
                    <option value={0}>0% (Standard Fee)</option>
                    <option value={25}>25% Tuition Concession</option>
                    <option value={50}>50% Half Fee Waiver</option>
                    <option value={75}>75% State Freeship</option>
                    <option value={80}>80% e-Kalyan SC/ST Freeship</option>
                    <option value={100}>100% Full TFW Waiver</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Scholarship / Concession Scheme Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Post-Matric e-Kalyan Freeship / TFW"
                  value={editScholarshipName}
                  onChange={(e) => setEditScholarshipName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="hallTicketCheck"
                  checked={editHallTicketBlocked}
                  onChange={(e) => setEditHallTicketBlocked(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="hallTicketCheck" className="text-slate-700 cursor-pointer text-xs">
                  Withhold Admit Card / Hall Ticket (prevent exam pass download until cleared)
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditFeeModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-sm"
                >
                  Save Fee Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
