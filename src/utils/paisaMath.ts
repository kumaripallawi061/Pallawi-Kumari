/**
 * Paisa-Scaled Integer Financial Math Library
 * Standardizes all monetary calculations to pure integer Paisa (1 INR = 100 Paisa).
 * Eliminates IEEE 754 floating-point inaccuracies, fractional cent drift, and rounding vulnerabilities.
 */

export type Paisa = number;

/**
 * Converts Rupees (number, string) to whole integer Paisa.
 * Rounds to nearest integer Paisa to prevent fractional sub-units.
 */
export function toPaisa(rupees: unknown, fallback: Paisa = 0): Paisa {
  if (rupees === null || rupees === undefined || rupees === '') {
    return fallback;
  }
  const num = typeof rupees === 'number' ? rupees : Number(rupees);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  // Standard half-up integer rounding using millipaisa epsilon correction
  return Math.round(Math.round(num * 1000) / 10);
}

/**
 * Converts integer Paisa back to Rupees (decimal).
 */
export function fromPaisa(paisa: Paisa): number {
  if (!Number.isFinite(paisa)) return 0;
  return paisa / 100;
}

/**
 * Checks if a value is a valid non-negative integer Paisa value.
 */
export function isValidPaisa(val: unknown): val is Paisa {
  return typeof val === 'number' && Number.isSafeInteger(val) && val >= 0;
}

/**
 * Performs safe integer addition of Paisa values.
 */
export function paisaAdd(...amounts: unknown[]): Paisa {
  return amounts.reduce<Paisa>((acc, curr) => {
    const val = typeof curr === 'number' 
      ? curr 
      : (typeof curr === 'string' && /^-?\d+$/.test(curr.trim()) ? parseInt(curr.trim(), 10) : toPaisa(curr));
    const safe = Number.isSafeInteger(val) ? val : Math.round(val || 0);
    return acc + safe;
  }, 0);
}

/**
 * Performs safe integer subtraction (guaranteed non-negative if floorAtZero = true).
 */
export function paisaSub(minuend: unknown, subtrahend: unknown, floorAtZero: boolean = true): Paisa {
  const m = typeof minuend === 'number' 
    ? minuend 
    : (typeof minuend === 'string' && /^-?\d+$/.test(minuend.trim()) ? parseInt(minuend.trim(), 10) : toPaisa(minuend));
  const s = typeof subtrahend === 'number' 
    ? subtrahend 
    : (typeof subtrahend === 'string' && /^-?\d+$/.test(subtrahend.trim()) ? parseInt(subtrahend.trim(), 10) : toPaisa(subtrahend));
  const safeM = Number.isSafeInteger(m) ? m : Math.round(m || 0);
  const safeS = Number.isSafeInteger(s) ? s : Math.round(s || 0);
  const diff = safeM - safeS;
  return floorAtZero ? Math.max(0, diff) : diff;
}

/**
 * Computes a percentage in integer Paisa.
 * Example: paisaMulPercent(1800000, 20) -> 20% of ₹18,000 = ₹3,600 = 360000 Paisa.
 */
export function paisaMulPercent(basePaisa: Paisa, percentage: number): Paisa {
  const base = Number.isSafeInteger(basePaisa) ? basePaisa : Math.round(basePaisa || 0);
  const pct = Number.isFinite(percentage) ? percentage : 0;
  // (base * pct) / 100 rounded to whole Paisa
  return Math.round((base * pct) / 100);
}

/**
 * Performs integer division of Paisa across installments or parts.
 */
export function paisaDivide(totalPaisa: Paisa, parts: number): Paisa {
  const total = Number.isSafeInteger(totalPaisa) ? totalPaisa : Math.round(totalPaisa || 0);
  const count = Number.isFinite(parts) && parts > 0 ? Math.floor(parts) : 1;
  return Math.floor(total / count);
}

/**
 * Verifies the fundamental financial ledger invariant:
 * Total == Paid + Pending (within exactly 0 Paisa tolerance)
 */
export function verifyLedgerBalance(totalPaisa: Paisa, paidPaisa: Paisa, pendingPaisa: Paisa): boolean {
  return totalPaisa === (paidPaisa + pendingPaisa);
}

/**
 * Formats an amount in integer Paisa into a standard Indian Rupee string (₹).
 * Options:
 * - showPaisa: if true, always prints .00 (or fractional paisa)
 */
export function formatPaisaINR(paisa: Paisa, showPaisa: boolean = false): string {
  const safe = Number.isFinite(paisa) ? paisa : 0;
  const rupees = safe / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showPaisa ? 2 : (safe % 100 === 0 ? 0 : 2),
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Splits an amount in Paisa across N installments, allocating any residual Paisas
 * to the final installment.
 * Guarantees that: sum(installments) === totalPaisa
 */
export function calculateInstallmentSchedule(totalPaisa: Paisa, installmentsCount: number): {
  baseInstallment: Paisa;
  finalInstallment: Paisa;
  installments: Paisa[];
  hasRemainder: boolean;
  remainderPaisa: Paisa;
} {
  const total = Number.isSafeInteger(totalPaisa) ? totalPaisa : Math.round(totalPaisa || 0);
  const count = Number.isFinite(installmentsCount) && installmentsCount > 0 ? Math.floor(installmentsCount) : 1;
  const base = Math.floor(total / count);
  const remainder = total - (base * count);
  const finalInst = base + remainder;

  const schedule: Paisa[] = [];
  for (let i = 0; i < count - 1; i++) {
    schedule.push(base);
  }
  schedule.push(finalInst);

  return {
    baseInstallment: base,
    finalInstallment: finalInst,
    installments: schedule,
    hasRemainder: remainder > 0,
    remainderPaisa: remainder,
  };
}
