import React, { useState } from 'react';
import { FeeTransaction, Student } from '../../types/fee';
import { INSTITUTION_INFO } from '../../data/mockData';
import { Printer, X, CheckCircle2, ShieldCheck, Maximize2 } from 'lucide-react';
import { InAppPdfPreviewer } from './InAppPdfPreviewer';

import { numberToWordsIndian } from '../../utils/numberToWords';

interface Props {
  transaction: FeeTransaction;
  student: Student;
  onClose: () => void;
}

export const PrintableReceipt: React.FC<Props> = ({ transaction, student, onClose }) => {
  const [showFullPdfPreview, setShowFullPdfPreview] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num: number): string => numberToWordsIndian(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Actions */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">Official College Fee Receipt Voucher</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFullPdfPreview(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Full-Screen PDF Viewer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Screen Preview</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div id="printable-receipt" className="p-8 sm:p-10 text-slate-900 bg-white overflow-y-auto flex-1">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex justify-between items-start mb-2">
              <div className="text-left">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Receipt No</span>
                <p className="font-mono font-bold text-sm text-slate-900">{transaction.receiptNo}</p>
              </div>
              <div className="text-center px-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase">{INSTITUTION_INFO.name}</h1>
                <p className="text-xs text-slate-600 mt-0.5">{INSTITUTION_INFO.accreditation}</p>
                <p className="text-[11px] text-slate-500">{INSTITUTION_INFO.address}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Date & Time</span>
                <p className="font-mono text-xs text-slate-900">{transaction.timestamp}</p>
              </div>
            </div>
            
            <div className="inline-block px-3 py-0.5 border border-slate-900 text-slate-900 text-xs font-bold uppercase tracking-wider mt-2">
              Official Academic Fee Receipt (Student Copy)
            </div>
          </div>

          {/* Student & Academic Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
            <div>
              <span className="text-slate-500 block">Student Name</span>
              <span className="font-semibold text-slate-900 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Roll / Register No</span>
              <span className="font-mono font-semibold text-slate-900">{student.rollNo}</span>
              <span className="text-[10px] text-slate-400 block font-mono">{student.registerNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Course & Branch</span>
              <span className="font-medium text-slate-900">{student.course} · {student.branch}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Term</span>
              <span className="font-medium text-slate-900">Year {student.year}, Sem {student.semester} ({INSTITUTION_INFO.academicSession})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Quota / Category</span>
              <span className="font-medium text-slate-900">{student.quota}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Mode</span>
              <span className="font-medium text-slate-900">{transaction.paymentMethod} ({transaction.gateway || 'Campus Counter'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Transaction Reference / UTR</span>
              <span className="font-mono text-slate-900">{transaction.bankUtr || transaction.gatewayTransactionId || 'OFFLINE-VERIFIED'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CONFIRMED & CLEARED</span>
              </span>
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-800 font-semibold">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Fee Head / Description</th>
                <th className="py-2.5 px-2 text-center">Tax Exemption Status</th>
                <th className="py-2.5 px-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(transaction?.headsAllocated ?? []).length > 0 ? (
                (transaction?.headsAllocated ?? []).map((head, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-900">{head.headName}</td>
                    <td className="py-2.5 px-2 text-center text-slate-500 text-[11px]">Exempt under Sec 10(23C)</td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ₹{head.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2.5 px-2 font-mono text-slate-400">1</td>
                  <td className="py-2.5 px-2 font-medium text-slate-900">Tuition & Academic Semester Clearance</td>
                  <td className="py-2.5 px-2 text-center text-slate-500 text-[11px]">Exempt under Sec 10(23C)</td>
                  <td className="py-2.5 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ₹{transaction.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {transaction.lateFineIncluded > 0 && (
                <tr className="bg-amber-50/40 text-amber-900">
                  <td className="py-2 px-2 font-mono text-slate-400">·</td>
                  <td className="py-2 px-2 font-medium">Overdue Late Fine Charge</td>
                  <td className="py-2 px-2 text-center text-slate-500 text-[11px]">Statutory Fine</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold">
                    +₹{transaction.lateFineIncluded.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              {transaction.discountApplied > 0 && (
                <tr className="bg-emerald-50/40 text-emerald-900">
                  <td className="py-2 px-2 font-mono text-slate-400">·</td>
                  <td className="py-2 px-2 font-medium">
                    Institutional Scholarship / Freeship Waiver ({student.scholarshipName || 'Merit Waiver'})
                  </td>
                  <td className="py-2 px-2 text-center text-slate-500 text-[11px]">Freeship Concession</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold">
                    -₹{transaction.discountApplied.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold text-slate-950 text-sm">
                <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">
                  Total Amount Collected:
                </td>
                <td className="py-3 px-2 text-right font-mono tabular-nums text-base">
                  ₹{transaction.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in words & Notes */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs mb-8">
            <span className="font-semibold text-slate-700">Amount in Words: </span>
            <span className="font-serif italic text-slate-900 font-medium">
              {numberToWords(transaction.amount)}
            </span>
          </div>

          {/* Signatures & Verification Stamp */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 text-xs items-end">
            <div>
              <div className="w-24 h-24 border border-slate-300 p-1 flex flex-col items-center justify-center bg-slate-50 text-[10px] text-center text-slate-500">
                <div className="font-mono text-[9px] text-slate-400 mb-1">DIGITAL QR AUTH</div>
                <div className="w-16 h-16 bg-slate-200 border border-slate-400 flex items-center justify-center text-[8px] font-mono text-slate-700">
                  [VERIFIED QR]
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Scan to verify authenticity at portal</p>
            </div>

            <div className="text-center">
              <div className="inline-block p-2 border-2 border-dashed border-emerald-600 rounded text-emerald-800 font-bold uppercase text-[11px] tracking-wider transform -rotate-2">
                APEX FINANCE DEPT<br />
                DIGITALLY VERIFIED
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Cashier / Gateway Ledger Auto-Signed</p>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-slate-700 font-semibold mb-1">
                {transaction.cashierName ? transaction.cashierName : 'Finance Officer (System Auto)'}
              </div>
              <div className="border-t border-slate-400 pt-1 text-slate-600 font-medium">
                Authorized Signatory / Bursar
              </div>
              <p className="text-[10px] text-slate-400">Apex Institute Accounts Division</p>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
            * This is a computer-generated fee receipt. No physical signature required. Keep safe for university records and clearance.
          </div>
        </div>
      </div>

      {/* FULL SCREEN IN-APP PDF PREVIEWER */}
      {showFullPdfPreview && (
        <InAppPdfPreviewer
          isOpen={showFullPdfPreview}
          onClose={() => setShowFullPdfPreview(false)}
          defaultFullScreen={true}
          document={{
            id: `RCPT-${transaction.id}`,
            title: `Fee Receipt Voucher #${transaction.receiptNo}`,
            subtitle: `${student.name} (${student.rollNo}) - ₹${transaction.amount}`,
            type: 'receipt',
            badgeText: 'Verified Receipt Voucher',
            badgeColor: 'emerald',
            fileName: `College_Fee_Receipt_${transaction.receiptNo}_${student.rollNo}.pdf`,
            contentNode: (
              <div className="p-8 sm:p-12 text-slate-900 bg-white space-y-6">
                <div className="border-b-2 border-slate-900 pb-5 text-center relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-left">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Receipt No</span>
                      <p className="font-mono font-bold text-sm text-slate-900">{transaction.receiptNo}</p>
                    </div>
                    <div className="text-center px-4">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase">{INSTITUTION_INFO.name}</h1>
                      <p className="text-xs text-slate-600 mt-0.5">{INSTITUTION_INFO.accreditation}</p>
                      <p className="text-[11px] text-slate-500">{INSTITUTION_INFO.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Date & Time</span>
                      <p className="font-mono text-xs text-slate-900">{transaction.timestamp}</p>
                    </div>
                  </div>
                  <div className="inline-block px-3 py-0.5 border border-slate-900 text-slate-900 text-xs font-bold uppercase tracking-wider mt-2">
                    Official Academic Fee Receipt (Student Copy)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                  <div>
                    <span className="text-slate-500 block">Student Name:</span>
                    <strong className="text-slate-900 text-sm font-semibold">{student.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Enrollment Roll No:</span>
                    <strong className="font-mono text-slate-900 font-semibold">{student.rollNo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Course & Branch:</span>
                    <span className="text-slate-800 font-medium">{student.course} ({student.branch})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Academic Term:</span>
                    <span className="text-slate-800 font-medium">Semester {student.semester}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transaction Reference / UTR:</span>
                    <span className="font-mono text-slate-800 font-semibold">{transaction.bankUtr || transaction.gatewayTransactionId || transaction.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Mode:</span>
                    <span className="text-slate-800 font-semibold">{transaction.paymentMethod}</span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transaction?.headsAllocated ?? []).length > 0 ? (
                      (transaction?.headsAllocated ?? []).map((head, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{head.headName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">₹{head.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-3 font-medium text-slate-800">Tuition & Academic Semester Clearance</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">₹{transaction.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold text-slate-950 text-sm">
                    <tr>
                      <td className="py-3 px-3 text-right uppercase tracking-wider">Total Amount Collected:</td>
                      <td className="py-3 px-3 text-right font-mono text-base font-black">₹{transaction.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                  <span className="font-semibold text-slate-700">Amount in Words: </span>
                  <span className="font-serif italic text-slate-900 font-medium">{numberToWords(transaction.amount)}</span>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 text-xs items-end">
                  <div className="text-slate-500 text-[10px]">
                    <div className="font-mono text-[9px] text-slate-400 mb-1">DIGITAL QR AUTH</div>
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-[9px] text-slate-700 font-bold">
                      VERIFIED
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="inline-block p-2 border-2 border-dashed border-emerald-600 rounded text-emerald-800 font-bold uppercase text-[11px] tracking-wider">
                      FINANCE DEPT · DIGITALLY VERIFIED
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic text-slate-700 font-semibold mb-1">Authorized Signatory / Bursar</div>
                    <div className="border-t border-slate-400 pt-1 text-slate-600 font-medium">Finance Division</div>
                  </div>
                </div>
              </div>
            ),
          }}
        />
      )}
    </div>
  );
};
