import React, { useState } from 'react';
import { Student } from '../../types/fee';
import { StudentDue } from '../../types/campaign';
import { safeMatchStrings, safeLower } from '../../utils/safeHelpers';
import { 
  AlertTriangle, 
  Send, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageSquare,
  Clock,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface Props {
  students: Student[];
  studentDues?: StudentDue[];
  onToggleHallTicket: (studentId: string, blocked: boolean) => void;
}

export const DefaulterManager: React.FC<Props> = ({ students, studentDues = [], onToggleHallTicket }) => {
  const [filterBucket, setFilterBucket] = useState<'all' | '15' | '30' | '60'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForCommit, setSelectedStudentForCommit] = useState<Student | null>(null);
  const [commitDate, setCommitDate] = useState<string>('2025-09-10');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const defaulters = students.filter((s) => s.pendingFee > 0);

  const handleSendBatchWhatsApp = () => {
    setNotificationStatus(`Triggered WhatsApp fee reminder with dynamic UPI link to ${defaulters.length} parents.`);
    setTimeout(() => {
      setNotificationStatus(null);
    }, 4000);
  };

  const handleSendBatchSMS = () => {
    setNotificationStatus(`Automated SMS gateway dispatched to ${defaulters.length} registered contact numbers.`);
    setTimeout(() => {
      setNotificationStatus(null);
    }, 4000);
  };

  const filtered = defaulters.filter((s) => {
    const q = safeLower(searchQuery);
    const matchesSearch =
      safeLower(s.name).includes(q) ||
      safeLower(s.rollNo).includes(q) ||
      safeLower(s.branch).includes(q);
    if (!matchesSearch) return false;

    if (filterBucket === 'all') return true;

    // Calculate maximum overdue aging days for this student
    const studentDuesList = (studentDues || []).filter(
      (d) => safeMatchStrings(d.rollNo, s.rollNo) && d.balanceAmount > 0
    );
    let maxAgingDays = 0;
    if (studentDuesList.length > 0) {
      const nowMs = Date.now();
      for (const due of studentDuesList) {
        const dueDateMs = new Date(due.dueDate || due.createdAt || 0).getTime();
        const diffDays = Math.floor((nowMs - dueDateMs) / (1000 * 60 * 60 * 24));
        if (diffDays > maxAgingDays) maxAgingDays = diffDays;
      }
    } else {
      // Fallback heuristics: students with late fines are past grace period (> 15 or 30 days)
      if (s.lateFineApplied > 0) maxAgingDays = 31;
      else maxAgingDays = 16;
    }

    if (filterBucket === '15') return maxAgingDays >= 15;
    if (filterBucket === '30') return maxAgingDays >= 30;
    if (filterBucket === '60') return maxAgingDays >= 60;

    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Fee Recovery & Defaulter Tracking</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Dunning Engine, Admit Card Locks & Escalation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate gentle multi-channel reminders before exam eligibility cutoff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendBatchWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Batch WhatsApp ({defaulters.length})</span>
          </button>
          <button
            onClick={handleSendBatchSMS}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast SMS & Email</span>
          </button>
        </div>
      </section>

      {/* Temporary Toast notification */}
      {notificationStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student, roll number, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Aging Filter:</span>
          <button
            onClick={() => setFilterBucket('all')}
            className={`px-2.5 py-1 rounded font-medium ${
              filterBucket === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            All Overdue ({defaulters.length})
          </button>
          <button
            onClick={() => setFilterBucket('15')}
            className={`px-2.5 py-1 rounded font-medium ${
              filterBucket === '15' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            &gt; 15 Days
          </button>
          <button
            onClick={() => setFilterBucket('30')}
            className={`px-2.5 py-1 rounded font-medium ${
              filterBucket === '30' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            &gt; 30 Days (Critical)
          </button>
        </div>
      </div>

      {/* Defaulter Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4">Student & Roll No</th>
              <th className="py-3 px-3">Course / Branch</th>
              <th className="py-3 px-3">Parent Contact</th>
              <th className="py-3 px-3 text-right">Pending Principal (₹)</th>
              <th className="py-3 px-3 text-right">Late Fine (₹)</th>
              <th className="py-3 px-3 text-right">Total Due (₹)</th>
              <th className="py-3 px-3 text-center">Admit Card / Hall Ticket</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((s) => {
              const totalDue = s.pendingFee + s.lateFineApplied;
              return (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{s.rollNo}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800">{s.course}</span>
                    <div className="text-[11px] text-slate-500">{s.branch} (Sem {s.semester})</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{s.parentName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{s.parentPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                    ₹{s.pendingFee.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-amber-700">
                    +₹{s.lateFineApplied.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 text-sm">
                    ₹{totalDue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onToggleHallTicket(s.id, !s.hallTicketBlocked)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        s.hallTicketBlocked
                          ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                      title={s.hallTicketBlocked ? 'Click to unblock exam admit card' : 'Click to withhold admit card'}
                    >
                      {s.hallTicketBlocked ? (
                        <>
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Withheld</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Clear / Eligible</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setNotificationStatus(`Payment reminder link SMS/WhatsApp sent to ${s.name} (${s.parentPhone}).`);
                          setTimeout(() => setNotificationStatus(null), 3500);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-600 transition-colors"
                        title="Send WhatsApp Payment Link"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
