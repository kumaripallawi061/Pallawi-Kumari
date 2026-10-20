import React, { useState, useEffect } from 'react';
import { 
  HelpdeskConfig, 
  HelpdeskCriterion, 
  UserSession, 
  Student 
} from '../../types/fee';
import { 
  Headphones, 
  MessageSquare, 
  Mail, 
  X, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Settings, 
  Bot, 
  Download,
  ListFilter,
  FileSpreadsheet,
  Clock,
  Sparkles
} from 'lucide-react';

export interface LoggedHelpdeskTicket {
  id: string;
  ticketNo: string;
  rollNo: string;
  studentName: string;
  category: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  contactEmail: string;
}

const STORAGE_KEY = 'rlsy_helpdesk_inquiry_tickets';

const INITIAL_DEMO_TICKETS: LoggedHelpdeskTicket[] = [
  {
    id: 'tkt-001',
    ticketNo: 'TKT-829104',
    rollNo: '2025/CS/001',
    studentName: 'Aarav Kumar',
    category: 'Tuition Fee & Dues',
    subject: 'Challan payment receipt not syncing with portal',
    message: 'Paid via State Bank Collect reference DU8291024 yesterday. Fee status still shows pending.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    contactEmail: 'accounts@rlsycollege.ac.in',
  },
  {
    id: 'tkt-002',
    ticketNo: 'TKT-918231',
    rollNo: '2025/CS/002',
    studentName: 'Priya Sharma',
    category: 'Scholarship & Concession',
    subject: 'Bihar Post Matric Scholarship quota fee adjustment',
    message: 'Submitted PMS income certificate for BC category. Requesting update to net payable dues.',
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    contactEmail: 'scholarship@rlsycollege.ac.in',
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: HelpdeskConfig;
  session: UserSession | null;
  students?: Student[];
  onOpenAdminConfig?: () => void;
}

export const HelpdeskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  session,
  students = [],
  onOpenAdminConfig,
}) => {
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>(config.criteria[0]?.id || 'crit-fee');
  const [activeTab, setActiveTab] = useState<'ticket' | 'inquiries' | 'kb'>('ticket');

  // Ticket form state
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Tickets log state backed by localStorage
  const [tickets, setTickets] = useState<LoggedHelpdeskTicket[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_DEMO_TICKETS;
  });

  // Automated KB chat state
  const [kbMessages, setKbMessages] = useState<Array<{ id: string; sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      id: 'kb-init',
      sender: 'bot',
      text: 'Welcome to the RLSY ERP Knowledge Base & Automated Guidance. Ask any question regarding fee payments, No Dues, or certificates.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [kbInput, setKbInput] = useState('');

  // Persist tickets whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  if (!isOpen) return null;

  const currentCriterion: HelpdeskCriterion =
    config.criteria.find((c) => c.id === selectedCriterionId) || config.criteria[0];

  const userDisplayName = session?.name || 'Student / Staff User';
  const userIdentifier = session?.rollNo || session?.emailOrPhone || 'CAMPUS-USER';

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailMessage.trim() || !mailSubject.trim()) return;

    const ticketNo = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: LoggedHelpdeskTicket = {
      id: `tkt-${Date.now()}`,
      ticketNo,
      rollNo: userIdentifier,
      studentName: userDisplayName,
      category: currentCriterion.category,
      subject: mailSubject.trim(),
      message: mailMessage.trim(),
      status: 'Open',
      createdAt: new Date().toISOString(),
      contactEmail: currentCriterion.supportEmail,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setTicketSuccess(`Inquiry #${ticketNo} successfully registered in the College ERP Support Register and assigned to ${currentCriterion.supportEmail}.`);
    setMailSubject('');
    setMailMessage('');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(currentCriterion.supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSendKbMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbInput.trim()) return;

    const text = kbInput.trim();
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setKbMessages((prev) => [...prev, userMsg]);
    setKbInput('');

    setTimeout(() => {
      let reply = `Inquiry recorded. For official redressal, please submit a formal inquiry ticket under the "Submit Ticket" tab or contact ${currentCriterion.supportEmail}.`;
      const lower = text.toLowerCase();
      if (lower.includes('fee') || lower.includes('pay') || lower.includes('deduct')) {
        reply = 'Bank & Treasury Settlement: Online payments take 24-48 hours to settle. Keep your DU or SBI Collect transaction reference number ready when lodging a ticket.';
      } else if (lower.includes('no dues') || lower.includes('clearance')) {
        reply = 'No Dues Clearance: Requires clearance from Library, Workshop, Hostel, and Accounts. Contact your departmental HOD or submit an in-app ticket.';
      } else if (lower.includes('tax') || lower.includes('80c') || lower.includes('80e')) {
        reply = 'Income Tax Certificates: Issued under Section 80C (Tuition Fees) or 80E (Higher Education Fee Statement) filtered strictly by financial year.';
      }

      setKbMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 600);
  };

  const handleExportCsv = () => {
    if (tickets.length === 0) return;

    const headers = ['Ticket Number', 'Date', 'Roll No / ID', 'Student Name', 'Category', 'Subject', 'Status', 'Assigned Email'];
    const rows = tickets.map((t) => [
      `"${t.ticketNo}"`,
      `"${new Date(t.createdAt).toLocaleDateString('en-GB')}"`,
      `"${t.rollNo}"`,
      `"${t.studentName}"`,
      `"${t.category}"`,
      `"${t.subject.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.contactEmail}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RLSY_Helpdesk_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl border border-emerald-400/30 text-emerald-300">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">RLSY College In-App Helpdesk & Inquiry Register</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Statutory Redressal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official grievance tracking with CSV audit logging for college administrative office
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAdminConfig && (session?.isAppAdmin || session?.staffRole === 'App_Admin') && (
              <button
                type="button"
                onClick={onOpenAdminConfig}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Admin Settings</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Layout Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Department Criteria Selection */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Support Criteria
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {config.criteria.length} sections
              </span>
            </div>

            <div className="space-y-2">
              {config.criteria.map((crit) => {
                const isSelected = crit.id === selectedCriterionId;
                return (
                  <button
                    key={crit.id}
                    type="button"
                    onClick={() => {
                      setSelectedCriterionId(crit.id);
                      setTicketSuccess(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {crit.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {crit.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100">
                      <span className="font-mono text-slate-600 truncate max-w-[150px]" title={crit.supportEmail}>
                        {crit.supportEmail}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {crit.typicalResponseTime}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: View Tabs (Ticket Form, Inquiries Log, Automated KB) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Top Bar with Navigation Tabs */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{currentCriterion.category}</h4>
                  <span className="text-[11px] text-slate-500">({currentCriterion.supportEmail})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied Support Email' : 'Copy Support Email'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="inline-flex p-1 bg-slate-200 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('ticket')}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'ticket'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inquiries')}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'inquiries'
                      ? 'bg-white text-indigo-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Inquiry Log ({tickets.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('kb')}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'kb'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Automated KB</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Submit Ticket Form */}
            {activeTab === 'ticket' && (
              <div className="flex-1 p-5 overflow-y-auto">
                {ticketSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 max-w-md mx-auto my-6">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Support Ticket Registered</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ticketSuccess}</p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('inquiries')}
                        className="py-2 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        View in Inquiry Log
                      </button>
                      <button
                        type="button"
                        onClick={() => setTicketSuccess(null)}
                        className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Submit Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicket} className="space-y-4 max-w-xl mx-auto">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">User Identifier</label>
                        <input
                          type="text"
                          readOnly
                          value={userIdentifier}
                          className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Applicant Name</label>
                        <input
                          type="text"
                          readOnly
                          value={userDisplayName}
                          className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Inquiry Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder={`e.g. Issue regarding ${currentCriterion.category}`}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Detailed Description of Issue *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={mailMessage}
                        onChange={(e) => setMailMessage(e.target.value)}
                        placeholder="Provide relevant details (transaction ID, challan date, roll number, semester, or error text)..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600 resize-none outline-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Register Support Ticket</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: In-App Ticket Inquiry Log with CSV Export */}
            {activeTab === 'inquiries' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      Registered Inquiries Register
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Persistent records for college office and administrative redressal
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                        <th className="py-2 px-3 font-semibold">Ticket #</th>
                        <th className="py-2 px-3 font-semibold">Date</th>
                        <th className="py-2 px-3 font-semibold">Student / ID</th>
                        <th className="py-2 px-3 font-semibold">Category</th>
                        <th className="py-2 px-3 font-semibold">Subject & Message</th>
                        <th className="py-2 px-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                            {t.ticketNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {new Date(t.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 block">{t.studentName}</span>
                            <span className="font-mono text-[10px] text-slate-500">{t.rollNo}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {t.category}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <span className="font-bold text-slate-800 block truncate">{t.subject}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">{t.message}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Automated KB Guidance */}
            {activeTab === 'kb' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong>Knowledge Base Assistant:</strong> This interactive guidance module provides statutory information about college fee structures and deadlines. To submit a formal request for action by administrative officers, please use the <strong>Submit Ticket</strong> tab.
                  </div>

                  {kbMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                        {msg.sender === 'user' ? userDisplayName : 'ERP Guidance Assistant'} · {msg.time}
                      </span>
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-emerald-700 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendKbMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={kbInput}
                    onChange={(e) => setKbInput(e.target.value)}
                    placeholder="Ask guidance on fees, challans, refunds, or certificates..."
                    className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!kbInput.trim()}
                    className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
