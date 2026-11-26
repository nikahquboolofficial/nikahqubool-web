export interface DailyLimitState {
  isLimitReached: boolean;
  remainingMs: number;
  count: number;
}

export const DAILY_FREE_PROFILE_LIMIT = 20;

// 🕒 Standard Indian Matrimonial (Asia/Kolkata) Midnight 24h Reset
// Synchronized seamlessly across all devices, mobile apps, and browsers!
export function getRemainingTimeUntilMidnight(): number {
  const now = new Date();
  const kolkataTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const kolkataNow = new Date(kolkataTimeStr);
  const nextMidnight = new Date(kolkataNow);
  nextMidnight.setHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - kolkataNow.getTime();
  return Math.max(0, diff);
}

export function checkDailyViewLimit(
  newLoadedCount: number, 
  isPaidParam: boolean, 
  tab: string = 'best-matches'
): DailyLimitState {
  if (isPaidParam) {
    return { isLimitReached: false, remainingMs: 0, count: 0 };
  }

  const remainingMs = getRemainingTimeUntilMidnight();

  try {
    const storageKey = `daily_profile_views_tracker_${tab}`;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const stored = localStorage.getItem(storageKey);

    let record = { date: todayStr, count: 0 };
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayStr) {
          record = parsed;
        }
      } catch (e) {}
    }

    const totalCount = Math.max(record.count, newLoadedCount);
    localStorage.setItem(storageKey, JSON.stringify({ date: todayStr, count: totalCount }));

    if (totalCount >= DAILY_FREE_PROFILE_LIMIT) {
      return { isLimitReached: true, remainingMs, count: totalCount };
    }
  } catch (e) {}

  if (newLoadedCount >= DAILY_FREE_PROFILE_LIMIT) {
    return { isLimitReached: true, remainingMs, count: newLoadedCount };
  }

  return { isLimitReached: false, remainingMs, count: newLoadedCount };
}

export function getRemainingTimeForTab(tab: string = 'best-matches'): number {
  return getRemainingTimeUntilMidnight();
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
