const USD_TO_LKR_RATE = Number(import.meta.env.VITE_USD_TO_LKR_RATE || '300');

export function toDisplayCurrency(code?: string | null) {
  const normalized = (code || '').trim().toUpperCase();

  // UX requirement: show Sri Lankan currency labels in the UI while gateway remains USD.
  if (!normalized || normalized === 'USD') {
    return 'LKR';
  }

  return normalized;
}

export function toDisplayAmount(amount: number, code?: string | null) {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized || normalized === 'USD') {
    return amount * USD_TO_LKR_RATE;
  }

  return amount;
}

export function formatDisplayAmount(amount: number, code?: string | null) {
  const convertedAmount = toDisplayAmount(amount, code);
  return `${toDisplayCurrency(code)} ${convertedAmount.toFixed(2)}`;
}
