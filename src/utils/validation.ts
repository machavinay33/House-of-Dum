import type { CheckoutErrors, CheckoutValues } from '@/types';

/** Returns the 10-digit Indian mobile number, or null if the input is not valid. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function validateCheckout(v: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = v.fullName.trim();
  if (name.length < 2) errors.fullName = 'Please enter your full name.';
  else if (name.length > 100) errors.fullName = 'Name is too long (max 100 characters).';

  if (!normalizePhone(v.phone)) errors.phone = 'Enter a valid 10-digit mobile number.';

  const address = v.address.trim();
  if (address.length < 10) errors.address = 'Please enter your full delivery address (at least 10 characters).';
  else if (address.length > 500) errors.address = 'Address is too long (max 500 characters).';

  const landmark = v.landmark.trim();
  if (landmark.length < 2) errors.landmark = 'Please add a landmark near your address.';
  else if (landmark.length > 150) errors.landmark = 'Landmark is too long (max 150 characters).';

  if (v.instructions.trim().length > 300) errors.instructions = 'Instructions can be at most 300 characters.';
  return errors;
}

export function normalizeOrderCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = cleaned.startsWith('HOD') ? cleaned.slice(3) : cleaned;
  return body.length === 0 ? '' : `HOD-${body.slice(0, 6)}`;
}

export function isValidOrderCode(code: string): boolean {
  return /^HOD-[A-Z0-9]{6}$/.test(code);
}
