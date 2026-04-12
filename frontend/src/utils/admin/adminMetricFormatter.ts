import { formatDisplayAmount } from '../currency';

const MONEY_KEY_PATTERN = /(revenue|income|amount|fee|earning|payment|profit|billing|charge|cost|price)/i;

type AdminMetricValue = number | string | null | undefined;

function toNumber(value: AdminMetricValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function isMoneyMetricKey(key: string) {
  return MONEY_KEY_PATTERN.test(key);
}

export function formatAdminMetricValue(
  key: string,
  value: AdminMetricValue,
  sourceCurrency: string = 'USD',
) {
  const numericValue = toNumber(value);

  if (numericValue == null) {
    return '--';
  }

  if (isMoneyMetricKey(key)) {
    return formatDisplayAmount(numericValue, sourceCurrency);
  }

  return numericValue.toLocaleString();
}
