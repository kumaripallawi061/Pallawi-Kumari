import React, { useState, useEffect } from 'react';
import { Student, StudentQuota, UserSession } from '../../types/fee';
import { toPaisa, fromPaisa, paisaSub, paisaAdd, Paisa } from '../../utils/paisaMath';
import { safeLower } from '../../utils/safeHelpers';
import { 
  CreditCard, 
  Search, 
  Edit3, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  Layers, 
  FileText, 
  Award, 
  DollarSign, 
  ChevronRight,
  RotateCcw,
  Camera,
  Upload,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface Props {
  students: Student[];
  onUpdateStudent: (updatedStudent: Student) => void;
  currentSession?: UserSession | null;
}

export const StudentFeeCustomizer: React.FC<Props> = ({ students, onUpdateStudent, currentSession }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [quotaFilter, setQuotaFilter] = useState<string>('ALL');

  // Role permissions: Accountant will not have option to change student fee
  const isAccountant = 
    currentSession?.staffRole === 'Accounts_Officer' || 
    currentSession?.staffRole === 'Cashier' ||
    safeLower(currentSession?.staffDesignation).includes('account');
  const isAdmin = 
    currentSession?.staffRole === 'App_Admin' || 
    currentSession?.staffRole === 'Principal_DDO' || 
    Boolean(currentSession?.isAppAdmin);

  const canEditFee = !isAccountant || isAdmin;

  // Form editing states
  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0] || null;

  // Fee state scaled to absolute integer Paisa (100 Paisa = 1 INR)
  const [editTotalFeePaisa, setEditTotalFeePaisa] = useState<Paisa>(toPaisa(activeStudent?.totalFee || 28500));
  const [editQuota, setEditQuota] = useState<StudentQuota>(activeStudent?.quota || 'State Merit (Subsidized)');
  const [editScholarshipWaiver, setEditScholarshipWaiver] = useState<number>(activeStudent?.scholarshipWaiverPercent || 0);
  const [editScholarshipName, setEditScholarshipName] = useState<string>(activeStudent?.scholarshipName || '');
  const [editHostelResident, setEditHostelResident] = useState<boolean>(activeStudent?.hostelResident || false);
  const [editLateFinePaisa, setEditLateFinePaisa] = useState<Paisa>(toPaisa(activeStudent?.lateFineApplied || 0));
  const [justificationReason, setJustificationReason] = useState<string>('');
  const [isApprovalConfirmed, setIsApprovalConfirmed] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState(false);

  // Structural useEffect hook listening to changes in activeStudent?.id to dynamically force-sync input state variables
  useEffect(() => {
    if (activeStudent) {
      setEditTotalFeePaisa(toPaisa(activeStudent.totalFee));
      setEditQuota(activeStudent.quota);
      setEditScholarshipWaiver(activeStudent.scholarshipWaiverPercent);
      setEditScholarshipName(activeStudent.scholarshipName || '');
      setEditHostelResident(activeStudent.hostelResident);
      setEditLateFinePaisa(toPaisa(activeStudent.lateFineApplied || 0));
      setJustificationReason('');
      setIsApprovalConfirmed(false);
      setValidationError(null);
      setSavedSuccessNotice(false);
    }
  }, [activeStudent?.id]);

  // Sync state when active student changes
  const handleSelectStudent = (stu: Student) => {
    setSelectedStudentId(stu.id);
    setEditTotalFeePaisa(toPaisa(stu.totalFee));
    setEditQuota(stu.quota);
    setEditScholarshipWaiver(stu.scholarshipWaiverPercent);
    setEditScholarshipName(stu.scholarshipName || '');
    setEditHostelResident(stu.hostelResident);
    setEditLateFinePaisa(toPaisa(stu.lateFineApplied || 0));
    setJustificationReason('');
    setIsApprovalConfirmed(false);
    setValidationError(null);
    setSavedSuccessNotice(false);
  };

  // Absolute integer Paisa calculations
  const activePaidFeePaisa = toPaisa(activeStudent?.paidFee || 0);
  const pendingFeePaisa = paisaSub(editTotalFeePaisa, activePaidFeePaisa);

  // Dynamically update total fee when waiver percent changes
  const handleWaiverChange = (newPercent: number) => {
    const validPercent = Math.max(0, Math.min(100, newPercent));
    setEditScholarshipWaiver(validPercent);
    
    // Derive un-discounted base fee
    const curTotal = activeStudent ? toPaisa(activeStudent.totalFee) : editTotalFeePaisa;
    const curWaiver = activeStudent?.scholarshipWaiverPercent || 0;
    const basePaisa = curWaiver < 100 ? Math.round(curTotal / (1 - curWaiver / 100)) : curTotal;
    
    const discountPaisa = Math.round(basePaisa * (validPercent / 100));
    const newTotalPaisa = Math.max(activePaidFeePaisa, basePaisa - discountPaisa);
    setEditTotalFeePaisa(newTotalPaisa);
    setValidationError(null);
  };

  // Save changes
  const handleSaveStudentFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    if (!canEditFee) {
      return; // Accountant is not authorized to change student fee
    }

    // Invariant validation: totalFee cannot be lower than already collected paidFee
    if (editTotalFeePaisa < activePaidFeePaisa) {
      setValidationError(
        `Total fee (₹${fromPaisa(editTotalFeePaisa).toLocaleString('en-IN')}) cannot be reduced below already settled paid amount (₹${fromPaisa(activePaidFeePaisa).toLocaleString('en-IN')}). Pending fee cannot be negative.`
      );
      return;
    }

    if (!justificationReason.trim() || justificationReason.trim().length < 5) {
      setValidationError('A mandatory justification reason (at least 5 characters) is required for institutional audit compliance.');
      return;
    }

    if (!isApprovalConfirmed) {
      setValidationError('Please confirm executive administrator approval checkbox before committing changes.');
      return;
    }

    setValidationError(null);

    // Only convert from Paisa back to decimal at final storage/presentation boundary
    const totalFee = fromPaisa(editTotalFeePaisa);
    const lateFineApplied = fromPaisa(editLateFinePaisa);
    const pendingFee = fromPaisa(pendingFeePaisa);

    const updated: Student = {
      ...activeStudent,
      totalFee,
      quota: editQuota,
      scholarshipWaiverPercent: editScholarshipWaiver,
      scholarshipName: editScholarshipName,
      hostelResident: editHostelResident,
      lateFineApplied,
      pendingFee,
      hallTicketBlocked: pendingFee > 0 && activeStudent.hallTicketBlocked,
      customFields: {
        ...(activeStudent.customFields || {}),
        feeCustomizationReason: justificationReason.trim(),
        feeCustomizedBy: currentSession?.name || 'Administrator',
        feeCustomizedAt: new Date().toISOString(),
      }
    };

    onUpdateStudent(updated);
    setSavedSuccessNotice(true);
    setTimeout(() => setSavedSuccessNotice(false), 3000);
  };

  const filteredStudents = students.filter((s) => {
    const q = safeLower(searchQuery);
    const matchesSearch = 
      safeLower(s.name).includes(q) ||
      safeLower(s.rollNo).includes(q) ||
      safeLower(s.course).includes(q);
    const matchesQuota = quotaFilter === 'ALL' || s.quota === quotaFilter;
    return matchesSearch && matchesQuota;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              canEditFee 
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {canEditFee ? 'App Administrator Control' : 'Accountant View-Only Mode'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Student Ledger Editor</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Student-Wise Fee Structure & Quota Customizer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {canEditFee 
              ? 'Modify total fee payable, grant scholarship waivers, adjust hostel overheads, or recalculate pending balances per student.'
              : 'View student ledger breakdowns, paid receipts, and statutory balances. Fee structure modifications are restricted to College Administrator.'}
          </p>
        </div>
      </div>

      {/* Accountant Restriction Advisory Banner */}
      {!canEditFee && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-950 block">
              Accountant Access Restriction: Fee Customization Locked
            </span>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Accountants do not have permission to alter student fee amounts, waive balances, or modify fee structures through this customizer. 
              Per institutional policy, individual fee adjustments require authorization from the <strong>College Principal / App Administrator</strong>.
              To update student quotas (PwD, NCC, Sports, etc.) via Roll Number upload, please navigate to the <strong>Student Update Menu</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selector List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-xs">
              Select Student ({students.length})
            </span>
            <span className="text-[10px] text-slate-400">Click to load ledger</span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roll no, student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <select
              value={quotaFilter}
              onChange={(e) => setQuotaFilter(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="ALL">All Quotas</option>
              <option value="State Merit (Subsidized)">State Merit (Subsidized)</option>
              <option value="TFW (Tuition Fee Waiver)">TFW Waiver</option>
              <option value="SC/ST Post-Matric Freeship">SC/ST Freeship</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* List items */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredStudents.map((stu) => {
              const isSelected = stu.id === activeStudent?.id;
              return (
                <button
                  key={stu.id}
                  onClick={() => handleSelectStudent(stu)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="shrink-0">
                      {stu.profilePicture ? (
                        <img
                          src={stu.profilePicture}
                          alt={stu.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center border border-emerald-400">
                          {stu.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 truncate">
                      <span className="font-bold text-slate-900 block truncate">{stu.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Roll: <strong className="text-slate-800">{stu.rollNo}</strong> · {stu.course}
                      </span>
                      <span className="text-[10px] text-indigo-700 font-semibold block">
                        Total Fee: ₹{stu.totalFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Student Fee Structure Editor (8 Cols) */}
        {activeStudent && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {activeStudent.profilePicture ? (
                    <img
                      src={activeStudent.profilePicture}
                      alt={activeStudent.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center border-2 border-emerald-400 shadow-sm">
                      {activeStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {activeStudent.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-bold">
                      {activeStudent.rollNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeStudent.course} · {activeStudent.branch} · Year {activeStudent.year}, Semester {activeStudent.semester}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Pending Dues</span>
                <span className={`text-lg font-mono font-bold ${activeStudent.pendingFee === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {activeStudent.pendingFee === 0 ? '₹0 (CLEARED)' : `₹${activeStudent.pendingFee.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {savedSuccessNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Student fee structure successfully updated and synced across ledgers!</span>
              </div>
            )}

            <form onSubmit={handleSaveStudentFee} className="space-y-6 text-xs">
              {/* Main Total Fee Field */}
              <div className="p-5 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-700" />
                    <span>Total Fee Payable (₹)</span>
                  </label>
                  <span className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                    {!canEditFee && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    {canEditFee ? 'Direct Administrator Override' : 'Locked for Accountant'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-base">₹</span>
                    <input
                      type="number"
                      step="500"
                      required
                      disabled={!canEditFee}
                      value={Math.round(editTotalFeePaisa / 100)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') return;
                        const num = Number(val);
                        if (!isNaN(num) && num >= 0) {
                          setEditTotalFeePaisa(Math.round(num * 100));
                        }
                      }}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl font-mono font-bold text-lg ${
                        canEditFee 
                          ? 'bg-white border border-indigo-300 text-slate-900 focus:ring-2 focus:ring-indigo-600'
                          : 'bg-slate-100 border border-slate-300 text-slate-500 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-right min-w-[140px]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Paid Fee</span>
                    <span className="font-mono font-bold text-slate-700">₹{activeStudent.paidFee.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  New calculated pending balance: <strong className="font-mono text-slate-900">₹{fromPaisa(pendingFeePaisa).toLocaleString('en-IN')}</strong>.
                </p>
              </div>

              {/* Quota & Scholarship Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">
                      Government / Institutional Quota
                    </label>
                    {!canEditFee && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3 text-slate-400" /> Locked
                      </span>
                    )}
                  </div>
                  <select
                    disabled={!canEditFee}
                    value={editQuota}
                    onChange={(e) => setEditQuota(e.target.value as StudentQuota)}
                    className={`w-full p-2.5 rounded-xl font-medium ${
                      canEditFee 
                        ? 'bg-slate-50 border border-slate-300 focus:bg-white text-slate-900'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <option value="State Merit (Subsidized)">State Merit (Subsidized)</option>
                    <option value="General">General</option>
                    <option value="TFW (Tuition Fee Waiver)">TFW (Tuition Fee Waiver)</option>
                    <option value="SC/ST Post-Matric Freeship">SC/ST Post-Matric Freeship</option>
                    <option value="OBC / EWS Freeship">OBC / EWS Freeship</option>
                    <option value="General (Self-Financed)">General (Self-Financed)</option>
                    <option value="Physically Challenged (PWD)">Physically Challenged (PWD)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-semibold block">
                      Scholarship Fee Waiver (%)
                    </label>
                    {!canEditFee && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3 text-slate-400" /> Locked
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!canEditFee}
                    value={editScholarshipWaiver}
                    onChange={(e) => handleWaiverChange(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl font-mono ${
                      canEditFee 
                        ? 'bg-slate-50 border border-slate-300 focus:bg-white text-slate-900'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Scholarship Scheme Title (if applicable)
                  </label>
                  <input
                    type="text"
                    disabled={!canEditFee}
                    placeholder="e.g. State e-Kalyan Post-Matric Scheme"
                    value={editScholarshipName}
                    onChange={(e) => setEditScholarshipName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl ${
                      canEditFee 
                        ? 'bg-slate-50 border border-slate-300 focus:bg-white text-slate-900'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Late Fine Applied (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canEditFee}
                    value={Math.round(editLateFinePaisa / 100)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') return;
                      const num = Number(val);
                      if (!isNaN(num) && num >= 0) {
                        setEditLateFinePaisa(Math.round(num * 100));
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl font-mono ${
                      canEditFee 
                        ? 'bg-slate-50 border border-slate-300 focus:bg-white text-slate-900'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* Mandatory Audit Reason & Executive Authorization Step */}
              {canEditFee && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
                  <div>
                    <label className="text-slate-800 font-bold block mb-1">
                      Mandatory Justification Reason for Ledger Modification *
                    </label>
                    <input
                      type="text"
                      required
                      value={justificationReason}
                      onChange={(e) => {
                        setJustificationReason(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g. Principal Discretionary Waiver / Sports Honor / Resolution Ref #2026-04"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isApprovalConfirmed}
                      onChange={(e) => {
                        setIsApprovalConfirmed(e.target.checked);
                        setValidationError(null);
                      }}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-700 font-medium">
                      I certify that this student fee customization is authorized by the College Principal/DDO and complies with statutory higher education financial rules.
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  {!canEditFee ? (
                    <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      Accountant cannot edit fees. Use Student Update Menu to assign PwD/NCC/Sports quota.
                    </span>
                  ) : (
                    <span>Changes take effect immediately and recalculate student balance dues.</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {canEditFee && (
                    <button
                      type="button"
                      onClick={() => handleSelectStudent(activeStudent)}
                      className="py-2.5 px-4 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}

                  {canEditFee ? (
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Fee Structure Changes</span>
                    </button>
                  ) : (
                    <div className="py-2.5 px-4 bg-slate-100 border border-slate-300 text-slate-500 font-bold rounded-xl flex items-center gap-2 text-xs">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Fee Changes Restricted (Admin Authorization Required)</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
