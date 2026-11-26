/**
 * 🛡️ High-Precision UTC to Local Indian Time Parser
 */
export const parseChatUtcDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (typeof dateVal === 'object' && dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  }
  try {
    let str = String(dateVal).trim();
    if (!str) return new Date();
    if (/^\d{10,13}$/.test(str)) {
      const num = Number(str);
      const d = new Date(num < 10000000000 ? num * 1000 : num);
      if (!isNaN(d.getTime())) return d;
    }
    // If it already contains 'Z' or timezone offset (+05:30, etc.), parse as standard ISO
    if (/Z$/i.test(str) || /[+-]\d{2}:?\d{2}$/.test(str)) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }
    // Backend API & SQL Server send UTC timestamps without trailing 'Z' (e.g. 2026-11-05T06:32:00)
    // Appending 'Z' tells JavaScript the timestamp is in UTC, allowing accurate conversion to local IST (+5:30)
    const isoUtc = str.replace(' ', 'T') + 'Z';
    const dUtc = new Date(isoUtc);
    if (!isNaN(dUtc.getTime())) return dUtc;

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
};
