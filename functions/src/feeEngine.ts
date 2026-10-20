/**
 * Firebase Cloud Functions HTTP Calculation Triggers
 * Provides HTTP triggers for fee calculation and ledger verification.
 */

import { calculateStudentFeeScheduleServer, validateLedgerCommitServer } from '../../src/services/serverFeeEngine';

export interface CloudFunctionFeeRequest {
  body: {
    student: any;
    feeHeads: any[];
    concessionRules: any[];
    subjects?: any[];
  };
}

export interface CloudFunctionLedgerRequest {
  body: any;
}

/**
 * Cloud Function HTTP handler for /calculateFeeSchedule
 */
export async function calculateFeeScheduleHttp(req: CloudFunctionFeeRequest, res: any) {
  try {
    const { student, feeHeads, concessionRules, subjects } = req.body;
    if (!student) {
      return res.status(400).json({ error: 'Missing student object in request payload' });
    }

    const result = calculateStudentFeeScheduleServer(
      student,
      feeHeads || [],
      concessionRules || [],
      subjects || []
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Calculation failed',
      details: error?.message || String(error),
    });
  }
}

/**
 * Cloud Function HTTP handler for /validateLedgerCommit
 */
export async function validateLedgerCommitHttp(req: CloudFunctionLedgerRequest, res: any) {
  try {
    const payload = req.body;
    const validation = validateLedgerCommitServer(payload);

    if (!validation.isValid) {
      return res.status(422).json(validation);
    }

    return res.status(200).json(validation);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Validation failed',
      details: error?.message || String(error),
    });
  }
}
