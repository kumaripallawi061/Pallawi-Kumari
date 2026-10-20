import React, { useState, useEffect } from 'react';
import {
  FeeCampaign,
  StudentDue,
  CampaignPayment,
  AuditLogEntry,
} from '../../types/campaign';
import { SchoolStaffUser } from '../../types/fee';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  Bell,
  Send,
  Users,
  Eye,
  X,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  ShieldCheck,
  Sliders,
  UserCheck,
  MoreVertical,
} from 'lucide-react';
import { safeMatchStrings, safeLower } from '../../utils/safeHelpers';

interface Props {
  campaigns: FeeCampaign[];
  studentDues: StudentDue[];
  payments: CampaignPayment[];
  userRole: 'admin' | 'accountant';
  userName: string;
  userEmail: string;
  staffUsers?: SchoolStaffUser[];
  onExtendCampaign: (campaignId: string, newEndDate: string, reason: string) => void;
  onModifyCampaign?: (campaign: FeeCampaign) => void;
  onSendReminder: (campaignId: string, rollNumbers: string[]) => void;
  onUpdateReminderSchedule: (campaignId: string, schedule: FeeCampaign['reminderSchedule']) => void;
  onAddAuditLog: (log: AuditLogEntry) => void;
  onViewReceipt?: (payment: CampaignPayment) => void;
}

export const CollectionDashboard: React.FC<Props> = ({
  campaigns,
  studentDues,
  payments,
  userRole,
  userName,
  userEmail,
  staffUsers = [],
  onExtendCampaign,
  onModifyCampaign,
  onSendReminder,
  onUpdateReminderSchedule,
  onAddAuditLog,
  onViewReceipt,
}) => {
  // Filter States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'defaulters' | 'charts'>('campaigns');

  // Overflow 3-dot menu state
  const [openMenuCampaignId, setOpenMenuCampaignId] = useState<string | null>(null);

  // Close overflow menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!openMenuCampaignId) return;
    const handleDocumentClick = () => setOpenMenuCampaignId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuCampaignId(null);
    };
    window.addEventListener('click', handleDocumentClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuCampaignId]);

  // Campaign Detail Modal
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState<FeeCampaign | null>(null);
  const [detailStudentSearch, setDetailStudentSearch] = useState('');

  // Extension Modal
  const [extendingCampaign, setExtendingCampaign] = useState<FeeCampaign | null>(null);
  const [newEndDateInput, setNewEndDateInput] = useState('');
  const [extensionReasonInput, setExtensionReasonInput] = useState('');
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Reminder Success Alert
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  // Compute Totals
  const filteredDues = studentDues.filter((d) => {
    const matchesCampaign = selectedCampaignId === 'ALL' || d.campaignId === selectedCampaignId;
    const matchesCourse = selectedCourse === 'ALL' || d.course === selectedCourse;
    const matchesSemester = selectedSemester === 'ALL' || d.semester.toString() === selectedSemester;
    return matchesCampaign && matchesCourse && matchesSemester;
  });

  const totalExpected = filteredDues.reduce((sum, d) => sum + d.netAmount, 0);
  const totalCollected = filteredDues.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Defaulters List: Overdue or Pending sorted by balanceAmount desc
  const defaultersList = filteredDues
    .filter((d) => d.balanceAmount > 0)
    .sort((a, b) => b.balanceAmount - a.balanceAmount);

  // Unique Courses & Semesters for filtering
  const uniqueCourses = Array.from(new Set(studentDues.map((d) => d.course)));
  const uniqueSemesters = Array.from(new Set(studentDues.map((d) => d.semester))).sort((a, b) => a - b);

  // Handle Extension Submit
  const handleConfirmExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingCampaign) return;
    if (!newEndDateInput) {
      setExtensionError('Please pick a later end date.');
      return;
    }
    if (new Date(newEndDateInput) <= new Date(extendingCampaign.endDate)) {
      setExtensionError('New end date must be strictly after the existing end date.');
      return;
    }
    if (!extensionReasonInput.trim()) {
      setExtensionError('Reason for extension is mandatory.');
      return;
    }

    onExtendCampaign(extendingCampaign.id, newEndDateInput, extensionReasonInput.trim());
    setReminderNotice(`Campaign end date extended till ${new Date(newEndDateInput).toLocaleDateString()} and affected students notified.`);
    setTimeout(() => setReminderNotice(null), 4000);
    setExtendingCampaign(null);
    setNewEndDateInput('');
    setExtensionReasonInput('');
    setExtensionError(null);
  };

  // Handle Reminders
  const handleTriggerCampaignReminder = (campaign: FeeCampaign) => {
    const pendingRolls = studentDues
      .filter((d) => d.campaignId === campaign.id && d.balanceAmount > 0)
      .map((d) => d.rollNo);

    onSendReminder(campaign.id, pendingRolls);
    setReminderNotice(`Reminder notice sent to ${pendingRolls.length} students with outstanding dues.`);
    setTimeout(() => setReminderNotice(null), 4000);
  };

  const handleSendIndividualReminder = (due: StudentDue) => {
    onSendReminder(due.campaignId, [due.rollNo]);
    setReminderNotice(`Direct fee notice dispatched to ${due.studentName} (${due.rollNo}).`);
    setTimeout(() => setReminderNotice(null), 3000);
  };

  // CSV Export for Campaign Details
  const handleExportCampaignCsv = (campaign: FeeCampaign) => {
    const campaignDues = studentDues.filter((d) => d.campaignId === campaign.id);
    const csvContent =
      'Roll No,Student Name,Course,Semester,Net Fee,Paid,Balance,Status,Payment Link\n' +
      campaignDues
        .map(
          (d) =>
            `"${d.rollNo}","${d.studentName}","${d.course}",${d.semester},${d.netAmount},${d.paidAmount},${d.balanceAmount},"${d.status}","${d.paymentLink}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${campaign.title.replace(/[^a-zA-Z0-9]/g, '_')}_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // CSV Export for Outstanding Defaulters
  const handleExportDefaultersCsv = () => {
    if (defaultersList.length === 0) return;
    const csvContent =
      'Roll No,Student Name,Campaign,Course,Semester,Net Fee,Paid,Balance Due,Status,Payment Link\n' +
      defaultersList
        .map(
          (d) =>
            `"${d.rollNo}","${d.studentName}","${d.campaignTitle}","${d.course}",${d.semester},${d.netAmount},${d.paidAmount},${d.balanceAmount},"${d.status}","${d.paymentLink}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `RLSY_Accountant_Defaulters_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status breakdown for Donut Chart
  const statusCounts = {
    Paid: filteredDues.filter((d) => d.status === 'Paid').length,
    Partial: filteredDues.filter((d) => d.status === 'Partial').length,
    Pending: filteredDues.filter((d) => d.status === 'Pending').length,
    Expired: filteredDues.filter((d) => d.status === 'Expired' || d.status === 'Overdue').length,
  };
  const totalStatusCount = filteredDues.length || 1;

  return (
    <div className="space-y-4">
      {/* Top Banner Notice */}
      {reminderNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reminderNotice}</span>
          </div>
          <button type="button" onClick={() => setReminderNotice(null)} className="p-1">
            <X className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Refined 2x2 Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Expected */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Expected</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-slate-900 font-mono tracking-tight leading-none">
              ₹{totalExpected.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-normal text-slate-500 mt-1">
              {filteredDues.length} student dues
            </p>
          </div>
        </div>

        {/* Collected */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collected</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-emerald-600 font-mono tracking-tight leading-none">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-normal text-emerald-600 mt-1">
              {collectionPercentage}% achieved
            </p>
          </div>
        </div>

        {/* Pending Arrears */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Arrears</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-amber-600 font-mono tracking-tight leading-none">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-normal text-amber-600 mt-1">
              {defaultersList.length} with balance
            </p>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collection Rate</span>
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-[19px] font-bold text-slate-900 font-mono tracking-tight leading-none">
              {collectionPercentage}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, collectionPercentage)}%` }}
              />
            </div>
            <p className="text-[11px] font-normal text-slate-400 mt-1">
              Live gateway tracking
            </p>
          </div>
        </div>
      </div>

      {/* Global Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        {/* Campaign Filter */}
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="min-h-[40px] p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs"
        >
          <option value="ALL">All Campaigns ({campaigns.length})</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.status})
            </option>
          ))}
        </select>

        {/* Course Filter */}
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="min-h-[40px] p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
        >
          <option value="ALL">All Courses</option>
          {uniqueCourses.map((crs) => (
            <option key={crs} value={crs}>{crs}</option>
          ))}
        </select>

        {/* Semester Filter */}
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="min-h-[40px] p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
        >
          <option value="ALL">All Semesters</option>
          {uniqueSemesters.map((sem) => (
            <option key={sem} value={sem.toString()}>Semester {sem}</option>
          ))}
        </select>

        {(selectedCampaignId !== 'ALL' || selectedCourse !== 'ALL' || selectedSemester !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedCampaignId('ALL');
              setSelectedCourse('ALL');
              setSelectedSemester('ALL');
            }}
            className="min-h-[40px] px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Sub Tabs: Campaigns List / Defaulters / Charts */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span>Active & Past Campaigns</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'campaigns' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {campaigns.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('defaulters')}
          className={`min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'defaulters'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span>Outstanding Defaulters</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            activeTab === 'defaulters' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {defaultersList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={`min-h-[44px] px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'charts'
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Visual Analytics</span>
        </button>
      </div>

      {/* 1. CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.map((camp) => {
            const campDues = studentDues.filter((d) => d.campaignId === camp.id);
            const campExpected = campDues.reduce((s, d) => s + d.netAmount, 0);
            const campCollected = campDues.reduce((s, d) => s + d.paidAmount, 0);
            const campRate = campExpected > 0 ? Math.round((campCollected / campExpected) * 100) : 0;
            const paidCount = campDues.filter((d) => d.status === 'Paid').length;
            const partialCount = campDues.filter((d) => d.status === 'Partial').length;
            const pendingCount = campDues.filter((d) => d.status === 'Pending' || d.status === 'Overdue').length;

            const isExpired = new Date() > new Date(camp.endDate);
            const effectiveStatus = isExpired && camp.status === 'Active' ? 'Expired' : camp.status;

            const isAdmin = userRole === 'admin';
            const isNominated = (camp.nominatedStaffEmails || []).some(
              (e) => e.trim().toLowerCase() === (userEmail || '').trim().toLowerCase()
            );
            const isAuthorized = isAdmin || isNominated;

            return (
              <div
                key={camp.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
              >
                {/* 1. Card Header & Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                    {camp.method === 'EXCEL' ? 'Excel Upload' : 'Course Selection'} · {isAdmin ? 'Admin Control' : isNominated ? 'Nominated Editor' : 'Restricted'}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Exactly ONE status pill at the top right */}
                    {camp.extensions && camp.extensions.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Till {new Date(camp.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    ) : effectiveStatus === 'Active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    ) : effectiveStatus === 'Expired' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {effectiveStatus}
                      </span>
                    )}

                    {/* Overflow three-dot menu icon (⋮) for Administrative Actions */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuCampaignId(openMenuCampaignId === camp.id ? null : camp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Administrative actions"
                        aria-label="Administrative actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuCampaignId === camp.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCampaignId(null);
                              if (isAuthorized) {
                                setExtendingCampaign(camp);
                                setNewEndDateInput(camp.endDate);
                                setExtensionReasonInput('');
                                setExtensionError(null);
                              } else {
                                setReminderNotice(
                                  `Deadline extension restricted: Only Institutional Admin or staff nominated by Admin (${
                                    camp.nominatedStaffNames?.length ? camp.nominatedStaffNames.join(', ') : 'None nominated'
                                  }) can alter dates.`
                                );
                                setTimeout(() => setReminderNotice(null), 4000);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Extend Date</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCampaignId(null);
                              if (isAuthorized) {
                                onModifyCampaign?.(camp);
                              } else {
                                setReminderNotice(
                                  `Modification restricted: Only Institutional Admin or staff nominated by Admin (${
                                    camp.nominatedStaffNames?.length ? camp.nominatedStaffNames.join(', ') : 'None nominated'
                                  }) can modify this campaign.`
                                );
                                setTimeout(() => setReminderNotice(null), 4000);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-purple-600" />
                            <span>Modify Campaign</span>
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuCampaignId(null);
                              handleExportCampaignCsv(camp);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export CSV</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Typography & Content */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{camp.title}</h3>
                  {camp.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{camp.description}</p>
                  )}
                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {new Date(camp.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>

                {/* 3. Status Breakdown Structured Mini-Panel */}
                <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="grid grid-cols-2">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Expected</p>
                      <p className="text-sm font-bold text-slate-900 font-mono">₹{campExpected.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Collected</p>
                      <p className="text-sm font-bold text-emerald-600 font-mono">
                        ₹{campCollected.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">({campRate}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Horizontal 3-segment progress bar & Color-Coded Counts */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden flex">
                      {paidCount > 0 && (
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${(paidCount / Math.max(1, campDues.length)) * 100}%` }}
                        />
                      )}
                      {partialCount > 0 && (
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: `${(partialCount / Math.max(1, campDues.length)) * 100}%` }}
                        />
                      )}
                      {pendingCount > 0 && (
                        <div
                          className="bg-slate-300 h-full transition-all"
                          style={{ width: `${(pendingCount / Math.max(1, campDues.length)) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {paidCount} Paid
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {partialCount} Partial
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {pendingCount} Pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Action Button Hierarchy */}
                <div className={`grid ${pendingCount + partialCount > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-1`}>
                  <button
                    type="button"
                    onClick={() => setSelectedCampaignForDetail(camp)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Ledger</span>
                  </button>
                  {pendingCount + partialCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTriggerCampaignReminder(camp)}
                      className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span>Remind ({pendingCount + partialCount})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DEFAULTERS LIST */}
      {activeTab === 'defaulters' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Outstanding Balance Defaulters ({defaultersList.length})
              </h3>
              <p className="text-[11px] text-slate-500">Sorted by highest outstanding balance.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportDefaultersCsv}
                disabled={defaultersList.length === 0}
                className="min-h-[44px] px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:cursor-not-allowed"
                title={`Export ${defaultersList.length} defaulter records as CSV`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Defaulters CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rolls = defaultersList.map((d) => d.rollNo);
                  onSendReminder(defaultersList[0]?.campaignId || 'ALL', rolls);
                  setReminderNotice(`Bulk payment notice sent to ${rolls.length} students with overdue fees.`);
                  setTimeout(() => setReminderNotice(null), 4000);
                }}
                className="min-h-[44px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Remind All Defaulters</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {defaultersList.map((due) => (
              <div key={due.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{due.studentName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                      {due.rollNo}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {due.campaignTitle} · {due.course} (Sem {due.semester})
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-mono font-black text-rose-700 block">
                      ₹{due.balanceAmount.toLocaleString('en-IN')} Due
                    </span>
                    <span className="text-[10px] text-slate-400">Total: ₹{due.netAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendIndividualReminder(due)}
                    className="min-h-[40px] px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-amber-700" />
                    <span>Send Notice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. VISUAL ANALYTICS */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Status Donut Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Student Collection Status Distribution
            </h3>

            {/* Custom SVG Donut */}
            <div className="flex items-center justify-center p-4">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="18"
                />
                {/* Paid slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="18"
                  strokeDasharray={`${(statusCounts.Paid / totalStatusCount) * 238.7} 238.7`}
                  strokeDashoffset="0"
                />
                {/* Partial slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="18"
                  strokeDasharray={`${(statusCounts.Partial / totalStatusCount) * 238.7} 238.7`}
                  strokeDashoffset={`-${(statusCounts.Paid / totalStatusCount) * 238.7}`}
                />
                {/* Pending slice */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="18"
                  strokeDasharray={`${(statusCounts.Pending / totalStatusCount) * 238.7} 238.7`}
                  strokeDashoffset={`-${((statusCounts.Paid + statusCounts.Partial) / totalStatusCount) * 238.7}`}
                />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span>Fully Paid: <strong>{statusCounts.Paid}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span>Partial Paid: <strong>{statusCounts.Partial}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
                <span>Pending: <strong>{statusCounts.Pending}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <span>Expired/Overdue: <strong>{statusCounts.Expired}</strong></span>
              </div>
            </div>
          </div>

          {/* Collection Progress by Campaign */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Campaign Target Fulfillment Rate
            </h3>

            <div className="space-y-3 pt-2">
              {campaigns.map((camp) => {
                const cDues = studentDues.filter((d) => d.campaignId === camp.id);
                const exp = cDues.reduce((s, d) => s + d.netAmount, 0);
                const col = cDues.reduce((s, d) => s + d.paidAmount, 0);
                const pct = exp > 0 ? Math.round((col / exp) * 100) : 0;

                return (
                  <div key={camp.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 truncate pr-2">{camp.title}</span>
                      <span className="font-mono font-bold text-slate-700 shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Collected: ₹{col.toLocaleString('en-IN')}</span>
                      <span>Target: ₹{exp.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAIL MODAL */}
      {selectedCampaignForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold">{selectedCampaignForDetail.title}</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {selectedCampaignForDetail.id} · Deadline: {new Date(selectedCampaignForDetail.endDate).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCampaignForDetail(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Search within campaign */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student ledger by Name or Roll No..."
                  value={detailStudentSearch}
                  onChange={(e) => setDetailStudentSearch(e.target.value)}
                  className="w-full min-h-[40px] pl-8 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Student Ledger Table */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2.5">Roll No & Student</th>
                      <th className="p-2.5 text-right">Net Due</th>
                      <th className="p-2.5 text-right">Paid</th>
                      <th className="p-2.5 text-right">Balance</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentDues
                      .filter((d) => d.campaignId === selectedCampaignForDetail.id)
                      .filter((d) => {
                        const q = safeLower(detailStudentSearch);
                        return safeLower(d.studentName).includes(q) || safeLower(d.rollNo).includes(q);
                      })
                      .map((d) => {
                        const matchedPayment = payments.find(
                          (p) => p.campaignId === d.campaignId && safeMatchStrings(p.rollNo, d.rollNo)
                        );
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{d.studentName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{d.rollNo}</div>
                            </td>
                            <td className="p-2.5 text-right font-mono font-semibold">
                              ₹{d.netAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-700 font-bold">
                              ₹{d.paidAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-right font-mono text-rose-700 font-bold">
                              ₹{d.balanceAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : d.status === 'Partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {matchedPayment && onViewReceipt ? (
                                <button
                                  type="button"
                                  onClick={() => onViewReceipt(matchedPayment)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="View full-screen printable receipt"
                                >
                                  <Eye className="w-3 h-3 text-amber-400" />
                                  <span>Receipt</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Extension History on campaign */}
              {selectedCampaignForDetail.extensions.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Extension Audit Trail
                  </span>
                  {selectedCampaignForDetail.extensions.map((ext) => (
                    <div key={ext.id} className="text-[11px] text-slate-600 flex justify-between">
                      <span>
                        Extended to {new Date(ext.newEndDate).toLocaleDateString()} ({ext.reason})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">By {ext.extendedBy}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleExportCampaignCsv(selectedCampaignForDetail)}
                className="min-h-[44px] px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Ledger CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCampaignForDetail(null)}
                className="min-h-[44px] px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND END DATE MODAL */}
      {extendingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Extend Campaign End Date</h3>
              </div>
              <button
                type="button"
                onClick={() => setExtendingCampaign(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExtension} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {extensionError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                  {extensionError}
                </div>
              )}

              <div>
                <span className="text-slate-500 block mb-0.5">Campaign:</span>
                <strong className="text-slate-900 text-sm font-bold">{extendingCampaign.title}</strong>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Current End Date</label>
                <input
                  type="text"
                  disabled
                  value={new Date(extendingCampaign.endDate).toLocaleDateString()}
                  className="w-full min-h-[40px] p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">New Extended End Date *</label>
                <input
                  type="date"
                  required
                  value={newEndDateInput}
                  onChange={(e) => setNewEndDateInput(e.target.value)}
                  className="w-full min-h-[44px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-indigo-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Mandatory Reason for Extension *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Student Council request, banking network holiday, or festival grace period..."
                  value={extensionReasonInput}
                  onChange={(e) => setExtensionReasonInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                Upon confirming, campaign status will reset to <strong>Active</strong> and all affected students will receive an automated extension notice.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendingCampaign(null)}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
