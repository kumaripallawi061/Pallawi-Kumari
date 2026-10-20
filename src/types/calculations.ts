/**
 * Server-Side Calculation & Audit Ledger Contracts
 */

import { Student, FeeHeadItem, ConcessionSurchargeRule } from './fee';
import { Paisa } from '../utils/paisaMath';

export interface AppliedRuleDetail {
  ruleId: string;
  ruleCode: string;
  name: string;
  action: 'Concession' | 'Surcharge';
  calculationMode: 'Percentage' | 'Fixed' | 'Flat_Amount';
  value: number;
  targetHeadId?: string;
  appliedPaisa: Paisa;
}

export interface FeeHeadBreakdown {
  id: string;
  name: string;
  category: string;
  amountPaisa: Paisa;
  treasuryHeadCode?: string;
  isMandatory: boolean;
}

export interface ServerFeeCalculationResult {
  studentRollNo: string;
  studentName: string;
  baseFeePaisa: Paisa;
  tuitionPartPaisa: Paisa;
  feeHeadBreakdown: FeeHeadBreakdown[];
  concessions: AppliedRuleDetail[];
  surcharges: AppliedRuleDetail[];
  netConcessionPaisa: Paisa;
  netSurchargePaisa: Paisa;
  subtotalPaisa: Paisa;
  totalFeePaisa: Paisa;
  finalNetFeePaisa?: Paisa;
  paidFeePaisa: Paisa;
  pendingFeePaisa: Paisa;
  minimumFloorApplied: boolean;
  ledgerBalanced: boolean;
  calculationHash: string;
  timestamp: string;
  serverVersion: string;
  isVerified: boolean;
}

export interface LedgerCommitPayload {
  studentRollNo: string;
  previousTotalPaisa: Paisa;
  newTotalPaisa: Paisa;
  paidPaisa: Paisa;
  pendingPaisa: Paisa;
  differencePaisa: Paisa;
  authorizedBy: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  calculationHash: string;
  reason?: string;
}

export interface LedgerCommitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  verifiedPayload?: LedgerCommitPayload;
  auditSignature: string;
}
