import React, { useState } from 'react';
import { 
  StudentNotification, 
  Student, 
  StudentNoDuesApplication 
} from '../../types/fee';
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Check, 
  ArrowRight, 
  Filter, 
  Sparkles,
  QrCode,
  FileText,
  Building
} from 'lucide-react';
import { safeMatchStrings } from '../../utils/safeHelpers';

interface Props {
  notifications: StudentNotification[];
  student: Student;
  studentNoDues?: StudentNoDuesApplication;
  onMarkAsRead: (notifId: string) => void;
  onMarkAllAsRead: () => void;
  onOpenDynamicQrPayment: (amount: number, purpose?: string) => void;
  onNavigateToTab: (tab: 'home' | 'apply' | 'fees' | 'nodues' | 'certificates' | 'idcard' | 'achievements') => void;
}

export const StudentNotificationsPanel: React.FC<Props> = ({
  notifications,
  student,
  studentNoDues,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenDynamicQrPayment,
  onNavigateToTab,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'fee_due' | 'no_dues' | 'unread'>('all');

  // Filter only this student's notifications
  const studentNotifs = notifications.filter(
    (n) => safeMatchStrings(n.studentRollNo, student?.rollNo)
  );

  const unreadCount = studentNotifs.filter((n) => !n.isRead).length;

  const filteredNotifs = studentNotifs.filter((n) => {
    if (filterType === 'fee_due') return n.type === 'fee_due';
    if (filterType === 'no_dues') return n.type === 'no_dues';
    if (filterType === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-3">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications & Official Alerts</h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {unreadCount} New
                </span>
              ) : (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  All Caught Up
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.2">
              Payment due date countdowns, treasury fee alerts & inter-department No-Dues clearances.
            </p>
          </div>
        </div>

        {/* Mark All As Read */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 self-start sm:self-auto flex items-center gap-1 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none pb-1">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
            filterType === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Alerts ({studentNotifs.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('fee_due')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            filterType === 'fee_due'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>Fee Due Dates</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('no_dues')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
            filterType === 'no_dues'
              ? 'bg-indigo-700 text-white shadow-2xs'
              : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>No-Dues Clearance</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
            filterType === 'unread'
              ? 'bg-rose-700 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="px-4 pb-4 space-y-2.5">
        {filteredNotifs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5 opacity-80" />
            <span className="font-semibold block text-slate-800">No active alerts in this category</span>
            <span>Your student ledger and clearances are completely up to date.</span>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isUrgent = notif.urgency === 'urgent';
            const isWarning = notif.urgency === 'warning';
            const isSuccess = notif.urgency === 'success';

            return (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !notif.isRead ? 'ring-1 ring-emerald-500/30' : ''
                } ${
                  isUrgent
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : isSuccess
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50/70 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUrgent
                      ? 'bg-rose-600 text-white shadow-xs'
                      : isWarning
                      ? 'bg-amber-500 text-white shadow-xs'
                      : isSuccess
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-700 text-white'
                  }`}>
                    {notif.type === 'fee_due' ? (
                      <Calendar className="w-4 h-4" />
                    ) : notif.type === 'no_dues' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900">{notif.title}</span>
                      {notif.dueDate && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          isUrgent ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          Due: {notif.dueDate}
                        </span>
                      )}
                      {notif.dueAmount !== undefined && notif.dueAmount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white text-slate-800 border border-slate-300">
                          ₹{notif.dueAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">Logged: {notif.date}</span>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {notif.type === 'fee_due' && notif.dueAmount !== undefined && notif.dueAmount > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenDynamicQrPayment(notif.dueAmount || student.pendingFee, notif.title)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay via Dynamic QR</span>
                    </button>
                  ) : notif.actionTab === 'nodues' ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('nodues')}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Clearances</span>
                    </button>
                  ) : notif.actionTab === 'fees' ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('fees')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>View Fee Ledger</span>
                    </button>
                  ) : null}

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
