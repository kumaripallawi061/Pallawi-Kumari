/**
 * Utility functions for Birthday Detection and Greeting
 * Compares current date (month + day) against the user's stored dateOfBirth field.
 */

export interface BirthdayMatchResult {
  isBirthdayToday: boolean;
  formattedDob: string;
  birthMonth: number;
  birthDay: number;
}

/**
 * Compares today's date (month + day in client local time)
 * against the provided dateOfBirth string (e.g., 'YYYY-MM-DD', 'YYYY/MM/DD').
 */
export function checkIsBirthdayToday(dateOfBirth: string | undefined | null): BirthdayMatchResult {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return {
      isBirthdayToday: false,
      formattedDob: '',
      birthMonth: 0,
      birthDay: 0,
    };
  }

  // Extract clean date string up to T
  const clean = dateOfBirth.split('T')[0].trim();
  const parts = clean.split(/[-/]/);

  if (parts.length < 3) {
    return {
      isBirthdayToday: false,
      formattedDob: clean,
      birthMonth: 0,
      birthDay: 0,
    };
  }

  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthMonth) || isNaN(birthDay)) {
    return {
      isBirthdayToday: false,
      formattedDob: clean,
      birthMonth: 0,
      birthDay: 0,
    };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const isBirthdayToday = birthMonth === currentMonth && birthDay === currentDay;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedDob = birthMonth >= 1 && birthMonth <= 12
    ? `${birthDay} ${monthNames[birthMonth - 1]}`
    : clean;

  return {
    isBirthdayToday,
    formattedDob,
    birthMonth,
    birthDay,
  };
}
