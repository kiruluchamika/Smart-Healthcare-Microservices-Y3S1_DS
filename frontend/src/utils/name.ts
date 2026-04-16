export const LAST_NAME_PLACEHOLDER = '--';

const PLACEHOLDER_TOKENS = new Set(['-', '--', 'na', 'n/a', 'none']);

function normalizeNamePart(value?: string | null): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function isMeaningfulPart(value: string): boolean {
  if (!value) {
    return false;
  }

  return !PLACEHOLDER_TOKENS.has(value.toLowerCase());
}

export function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = 'Patient'
): string {
  const first = normalizeNamePart(firstName);
  const last = normalizeNamePart(lastName);

  const hasFirst = isMeaningfulPart(first);
  const hasLast = isMeaningfulPart(last);

  if (hasFirst && hasLast) {
    if (first.localeCompare(last, undefined, { sensitivity: 'accent' }) === 0) {
      return first;
    }
    return `${first} ${last}`;
  }

  if (hasFirst) {
    return first;
  }

  if (hasLast) {
    return last;
  }

  return fallback;
}
