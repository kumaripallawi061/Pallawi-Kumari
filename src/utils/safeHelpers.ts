/**
 * Defensive Utility Helpers for Null Safety, Crash Prevention & Calculation Integrity
 * Prevents TypeError exceptions, division by zero, NaN propagation, and JSON parse crashes.
 */

/**
 * Safely converts any value to a string, returning empty string or fallback if null/undefined.
 */
export const safeString = (val: unknown, fallback = ''): string => {
  if (val === null || val === undefined || val === 'null' || val === 'undefined') return fallback;
  return String(val);
};

export const safeTrim = (val: unknown): string => safeString(val).trim();

/**
 * Safely converts to lowercase, returning empty string if null/undefined.
 */
export function safeLower(val: unknown): string {
  return safeString(val).toLowerCase();
}

/**
 * Safely converts to uppercase, returning empty string if null/undefined.
 */
export function safeUpper(val: unknown): string {
  return safeString(val).toUpperCase();
}

/**
 * Safely compares two string values case-insensitively and whitespace-trimmed.
 * Returns false if either value is null, undefined, or empty string.
 */
export function safeMatchStrings(a: unknown, b: unknown): boolean {
  const strA = safeTrim(a).toLowerCase();
  const strB = safeTrim(b).toLowerCase();
  if (!strA || !strB) return false;
  return strA === strB;
}

/**
 * Converts Excel date serial number (e.g. 38353) or ISO date strings to YYYY-MM-DD.
 */
export function normalizeDateToYYYYMMDD(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).trim();
  
  // If it's a numeric Excel serial (e.g. 30000 to 50000)
  const num = Number(str);
  if (!isNaN(num) && num > 10000 && num < 70000) {
    // Excel epoch: Dec 30 1899 -> Jan 1 1970 is 25569 days
    const utcDays = num - 25569;
    const date = new Date(Math.round(utcDays * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // If already YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD/MM/YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
      // YYYY/MM/DD -> YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Safely parses any value into a valid finite number, returning fallback if invalid or NaN.
 */
export function safeNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Safely performs division, guarding against division by zero and NaN.
 */
export function safeDivide(numerator: unknown, denominator: unknown, fallback = 0): number {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  if (den === 0 || !Number.isFinite(den)) return fallback;
  const result = num / den;
  return Number.isFinite(result) ? result : fallback;
}

/**
 * Safely calculates a percentage (0 to 100), avoiding division by zero or NaN.
 */
export function safePercent(part: unknown, total: unknown, fallback = 0): number {
  const fraction = safeDivide(part, total, fallback);
  const percent = fraction * 100;
  return Number.isFinite(percent) ? Math.round(percent) : fallback;
}

/**
 * Safely parses JSON string with guaranteed fallback on syntax error.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely formats currency to INR string (e.g. ₹ 12,500), guarding against NaN.
 */
export function safeFormatCurrency(amount: unknown): string {
  const num = safeNumber(amount, 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Safely calls window.confirm without crashing in environments where confirm is disabled or throws.
 */
export function safeConfirm(message: string, defaultDecision = true): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(message);
    }
  } catch {
    return defaultDecision;
  }
  return defaultDecision;
}

/**
 * Safely calls window.alert without crashing in sandboxed iframes.
 */
export function safeAlert(message: string): void {
  try {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
      return;
    }
  } catch {
    // Suppress error in sandboxed environment
  }
  console.warn('[Notice]:', message);
}
