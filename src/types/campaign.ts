export type MasterCategory = 'Tuition' | 'Exam' | 'Lab' | 'Transport' | 'Other';

export interface MasterFeeHead {
  id: string;
  name: string;
  defaultAmount: number;
  description: string;
  category: MasterCategory;
  status: 'Active' | 'Inactive' | 'Draft';
  usedCount: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePlanHeadItem {
  headId: string;
  headName: string;
  amount: number;
}

export interface FeePlan {
  id: string;
  name: string;
  description: string;
  heads: FeePlanHeadItem[];
  totalAmount: number;
  status: 'Active' | 'Inactive';
  usedCount: number;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseMaster {
  id: string;
  name: string;
  code: string;
  durationYears: number;
  status: 'Active' | 'Inactive';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface SemesterMaster {
  id: string;
  semesterNumber: number;
  label: string;
  status: 'Active' | 'Inactive';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface SubjectMaster {
  id: string;
  name: string;
  code: string;
  courseCode: string;
  semester: number;
  isElective: boolean;
  status: 'Active' | 'Inactive';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: 'FeeHead' | 'FeePlan' | 'Course' | 'Semester' | 'Subject' | 'Campaign' | 'Provider' | 'Payment' | 'Refund' | 'Reconciliation';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' | 'RESTORE' | 'EXTEND' | 'PROVIDER_CHANGE' | 'RECONCILE' | 'REFUND' | 'OFFLINE_PAYMENT';
  userEmail: string;
  userName: string;
  userRole: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export type CampaignMethod = 'EXCEL' | 'SELECTION';
export type CampaignStatus = 'Draft' | 'Active' | 'Expired' | 'Closed';

export interface LateFeeConfig {
  enabled: boolean;
  type: 'FLAT' | 'PER_DAY';
  amount: number;
  maxCap?: number;
  graceDays: number;
}

export interface CampaignExtensionRecord {
  id: string;
  oldEndDate: string;
  newEndDate: string;
  extendedBy: string;
  extendedAt: string;
  reason: string;
}

export interface CampaignCohortDefinition {
  id: string;
  course: string;
  semester: number;
  heads: { headId: string; headName: string; amount: number; isDraft?: boolean }[];
  baseAmount: number;
  concessionType: 'None' | 'Percentage' | 'Flat';
  concessionValue: number;
  concessionReason?: string;
  concessionCriteria?: 'ALL' | 'FEMALE' | 'CATEGORY_SC_ST' | 'CATEGORY_OBC_EWS';
  concessionAmount: number;
  netFeePerStudent: number;
  enrolledStudentsCount: number;
  totalCohortExpectedAmount: number;
  includedRollNos?: string[];
}

export interface FeeCampaign {
  id: string;
  title: string;
  description: string;
  planId?: string;
  customHeads: { headId: string; headName: string; amount: number }[];
  totalAmount: number;
  minPartialAmount?: number;
  startDate: string;
  endDate: string;
  lateFee: LateFeeConfig;
  status: CampaignStatus;
  method: CampaignMethod;
  cohorts?: CampaignCohortDefinition[];
  nominatedStaffEmails?: string[];
  nominatedStaffIds?: string[];
  nominatedStaffNames?: string[];
  audienceCourses?: string[];
  audienceSemester?: number;
  audienceSubjects?: string[];
  studentCount: number;
  totalExpectedAmount: number;
  extensions: CampaignExtensionRecord[];
  reminderSchedule?: 'Daily' | 'Weekly' | 'Before_3_Days' | 'None';
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  updatedAt?: string;

  // Permanent Campaign Lifecycle Fields
  isPermanent?: boolean;
  permanentStatus?: 'Active' | 'Scheduled End' | 'Deactivated';
  permanentFeeType?: 'Monthly' | 'Semester' | 'Annual';
  targetStreams?: string[];
  hasNoEndDate?: boolean;
  activeSince?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  deactivationReason?: string;
}

export interface StudentDueLineItem {
  headId: string;
  name: string;
  amount: number;
}

export interface StudentDue {
  id: string;
  campaignId: string;
  campaignTitle: string;
  studentId?: string;
  studentEmail?: string;
  rollNo: string;
  studentName: string;
  course: string;
  semester: number;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Expired' | 'Waived';
  lineItems: StudentDueLineItem[];
  lateFeeApplied: number;
  lateFeeReason?: string;
  paymentLink: string;
  paymentLinkActive: boolean;
  lastPaymentDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProviderType = 
  | 'SBI e-Pay / SBI Collect'
  | 'Razorpay' 
  | 'Cashfree' 
  | 'PayU' 
  | 'BillDesk'
  | 'HDFC SmartGateway'
  | 'ICICI EasyPay'
  | 'PhonePe' 
  | 'Paytm' 
  | 'Stripe' 
  | 'Custom / Other';

export type ProviderMode = 'Test' | 'Live';

export interface PaymentProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  mode: ProviderMode;
  merchantAccountId: string;
  apiKeyId: string;
  apiKeySecretMasked: string; // e.g. "••••••••1a2b"
  webhookSecretMasked: string;
  webhookUrl: string;
  customUrlTemplate?: string;
  customCallbackUrl?: string;
  status: 'Active' | 'Inactive';
  isOnboarded?: boolean;
  isMapped?: boolean;
  supportUpi?: boolean;
  supportNetBanking?: boolean;
  supportCards?: boolean;
  lastSuccessfulPayment?: string;
  activatedAt: string;
  deactivatedAt?: string;
  activatedBy: string;
  mappedAt?: string;
  mappedBy?: string;
}

export interface ProviderHistoryItem {
  id: string;
  name: string;
  type: ProviderType;
  mode: ProviderMode;
  activeFrom: string;
  activeTo: string;
  changedBy: string;
  merchantAccountId: string;
  pendingTxCount?: number;
}

export type PaymentMethodType = 'UPI' | 'Card' | 'NetBanking' | 'Cash' | 'Cheque' | 'DD';

export interface CampaignPayment {
  id: string;
  receiptNo: string;
  dueId: string;
  campaignId: string;
  campaignTitle: string;
  rollNo: string;
  studentName: string;
  course: string;
  semester: number;
  amountPaid: number;
  lateFeePaid: number;
  balanceRemaining: number;
  lineItems: StudentDueLineItem[];
  paymentMode: 'Online Gateway' | 'Cash' | 'Cheque' | 'DD' | 'POS';
  methodDetail?: string; // e.g. UPI ID or SBI Collect or Bank DD #
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  providerMode: ProviderMode;
  transactionId: string;
  gatewayReference?: string;
  idempotencyKey: string;
  status: 'Success' | 'Failed' | 'Pending' | 'Mismatched' | 'Cancelled' | 'Refunded';
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  mismatchReason?: string;
  timestamp: string;
}

export interface ExcelUploadValidationRow {
  rowNumber: number;
  rollNo: string;
  studentName?: string;
  amountOverride?: number;
  baseAmount?: number;
  concession?: number;
  status: 'Matched' | 'Not_Found' | 'Duplicate' | 'Invalid';
  errorReason?: string;
}
