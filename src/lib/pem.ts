// Extract one or more PEM blocks of a given label from arbitrary text.

export function splitPems(text: string, label = 'CERTIFICATE'): string[] {
  const re = new RegExp(`-----BEGIN ${label}-----[\\s\\S]*?-----END ${label}-----`, 'g');
  return text.match(re) ?? [];
}

export function looksLikePem(text: string): boolean {
  return /-----BEGIN [A-Z0-9 ]+-----/.test(text);
}
