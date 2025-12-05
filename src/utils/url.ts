export const sanitizeUrl = (u: any): string => {
  try {
    const s = String(u ?? '').trim().replace(/`/g, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    return encodeURI(s);
  } catch {
    return '';
  }
};
