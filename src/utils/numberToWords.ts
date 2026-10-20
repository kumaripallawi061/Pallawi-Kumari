/**
 * Statutory-compliant Indian Number to Words converter for Rupees and Paise.
 * Supports exact currency conversion up to Crores with decimal Paise support.
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertUnderThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n > 0) str += ' and ';
  }
  if (n > 0) {
    if (n < 20) {
      str += ONES[n];
    } else {
      str += TENS[Math.floor(n / 10)];
      if (n % 10 > 0) {
        str += ' ' + ONES[n % 10];
      }
    }
  }
  return str.trim();
}

export function numberToWordsIndian(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (!num || isNaN(num) || num <= 0) {
    return 'Zero Rupees Only';
  }

  const rounded = Math.round(num * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let rupeeWords = '';
  let rem = rupees;

  if (rem >= 10000000) {
    const crore = Math.floor(rem / 10000000);
    rupeeWords += convertUnderThousand(crore) + ' Crore ';
    rem %= 10000000;
  }
  if (rem >= 100000) {
    const lakh = Math.floor(rem / 100000);
    rupeeWords += convertUnderThousand(lakh) + ' Lakh ';
    rem %= 100000;
  }
  if (rem >= 1000) {
    const thousand = Math.floor(rem / 1000);
    rupeeWords += convertUnderThousand(thousand) + ' Thousand ';
    rem %= 1000;
  }
  if (rem > 0) {
    rupeeWords += convertUnderThousand(rem);
  }

  rupeeWords = rupeeWords.trim();

  let paiseWords = '';
  if (paise > 0) {
    paiseWords = convertUnderThousand(paise);
  }

  if (rupeeWords && paiseWords) {
    return `${rupeeWords} Rupees and ${paiseWords} Paise Only`;
  }
  if (rupeeWords) {
    return `${rupeeWords} Rupees Only`;
  }
  if (paiseWords) {
    return `${paiseWords} Paise Only`;
  }

  return 'Zero Rupees Only';
}
