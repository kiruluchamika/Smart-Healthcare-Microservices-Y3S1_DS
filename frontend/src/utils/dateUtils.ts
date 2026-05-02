/**
 * Parses a date string safely, ensuring it is treated as UTC if no timezone is specified.
 * This is important for timestamps coming from the backend which may be lacking the 'Z' suffix.
 * 
 * @param dateString The ISO date string to parse.
 * @returns A Date object.
 */
export function parseUTCDate(dateString: string | null | undefined): Date {
  if (!dateString) {
    return new Date();
  }

  // If the string doesn't end with Z and doesn't contain a timezone offset like +00:00 or -05:00
  // we append 'Z' to treat the local time as UTC.
  const hasTimezone = dateString.endsWith('Z') || dateString.match(/[+-]\d{2}:\d{2}$/);
  
  if (!hasTimezone && dateString.includes('T')) {
    return new Date(`${dateString}Z`);
  }
  
  return new Date(dateString);
}
