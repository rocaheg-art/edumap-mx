/**
 * Utility function to shorten long educational degree names in career titles.
 * E.g., "TÉCNICO SUPERIOR UNIVERSITARIO EN MECATRÓNICA" -> "TSU EN MECATRÓNICA"
 */
export const shortenCareerName = (name: string) => {
  if (!name) return '';
  return name
    .replace(/TÉCNICO\s+SUPERIOR\s+UNIVERSITARIO/gi, 'TSU')
    .replace(/LICENCIATURA\s+EN\s+EDUCACIÓN\s+NORMAL/gi, 'NORMAL')
    .replace(/LICENCIATURA/gi, 'LIC.')
    .trim();
};
