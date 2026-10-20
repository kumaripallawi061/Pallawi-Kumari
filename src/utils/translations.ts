export type Language = 'en' | 'hi';

export interface TranslationStrings {
  signInPrimary: string;
  quickFeePay: string;
  adminLogin: string;
  feeNotice: string;
  myDashboard: string;
  pendingFees: string;
  duesCleared: string;
  payDynamicQr: string;
  disputeFee: string;
  lastUpdated: string;
  dueDate: string;
  viewProfile: string;
  feesTile: string;
  noDuesTile: string;
  certificatesTile: string;
  hallTicketTile: string;
  clearDuesToUnlock: string;
  admitCardReady: string;
  honorsTitle: string;
  noHonorsRecorded: string;
  signOut: string;
  lockWarningPrefix: string;
  lockWarningSuffix: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    signInPrimary: 'Sign In (Student & Staff)',
    quickFeePay: 'Quick Fee Payment',
    adminLogin: 'Admin Login',
    feeNotice: 'Fee Notice',
    myDashboard: 'My Dashboard',
    pendingFees: 'Pending Fees',
    duesCleared: 'All Dues Cleared',
    payDynamicQr: 'Pay via Dynamic QR',
    disputeFee: 'Fee amount wrong? Raise dispute',
    lastUpdated: 'Last updated',
    dueDate: 'Due Date',
    viewProfile: 'View profile',
    feesTile: 'Fees',
    noDuesTile: 'No Dues',
    certificatesTile: 'Certificates & Facilities',
    hallTicketTile: 'Hall Ticket',
    clearDuesToUnlock: 'Clear dues to unlock',
    admitCardReady: 'Admit Card Ready',
    honorsTitle: 'Honors & Achievements',
    noHonorsRecorded: '0 Honors & Achievements recorded',
    signOut: 'Sign Out',
    lockWarningPrefix: 'Pay ₹',
    lockWarningSuffix: ' to release your admit card',
  },
  hi: {
    signInPrimary: 'लॉग इन (छात्र एवं कर्मचारी)',
    quickFeePay: 'त्वरित शुल्क भुगतान',
    adminLogin: 'व्यवस्थापक लॉगिन',
    feeNotice: 'शुल्क सूचना',
    myDashboard: 'मेरा डैशबोर्ड',
    pendingFees: 'बकाया शुल्क',
    duesCleared: 'सभी शुल्क चुकता',
    payDynamicQr: 'डायनामिक क्यूआर से भुगतान करें',
    disputeFee: 'शुल्क गलत है? आपत्ति दर्ज करें',
    lastUpdated: 'अंतिम अपडेट',
    dueDate: 'अंतिम तिथि',
    viewProfile: 'प्रोफ़ाइल देखें',
    feesTile: 'शुल्क',
    noDuesTile: 'अनापत्ति (No Dues)',
    certificatesTile: 'प्रमाण पत्र एवं सुविधाएं',
    hallTicketTile: 'प्रवेश पत्र (Hall Ticket)',
    clearDuesToUnlock: 'अनलॉक करने हेतु शुल्क जमा करें',
    admitCardReady: 'प्रवेश पत्र उपलब्ध',
    honorsTitle: 'सम्मान एवं उपलब्धियां',
    noHonorsRecorded: '0 सम्मान एवं उपलब्धियां दर्ज',
    signOut: 'लॉग आउट',
    lockWarningPrefix: 'प्रवेश पत्र प्राप्त करने हेतु ₹',
    lockWarningSuffix: ' का भुगतान करें',
  },
};
