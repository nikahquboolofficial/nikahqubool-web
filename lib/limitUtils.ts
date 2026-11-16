export interface DailyLimitState {
  isLimitReached: boolean;
  remainingMs: number;
  count: number;
}

export const DAILY_FREE_PROFILE_LIMIT = 15;

export function checkDailyViewLimit(
  newLoadedCount: number, 
  isPaidParam: boolean, 
  tab: string = 'best-matches'
): DailyLimitState {
  if (isPaidParam) {
    return { isLimitReached: false, remainingMs: 0, count: 0 };
  }

  try {
    const now = Date.now();
    const storageKey = `daily_profile_views_tracker_${tab}`;
    const stored = localStorage.getItem(storageKey);

    let record = { timestamp: now, count: 0 };
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (now - parsed.timestamp < 86400000) {
          record = parsed;
        }
      } catch (e) {}
    }

    const totalCount = Math.max(record.count, newLoadedCount);
    const timeElapsed = now - record.timestamp;

    if (timeElapsed >= 86400000) {
      // 24 hours passed, reset window
      record = { timestamp: now, count: newLoadedCount };
      localStorage.setItem(storageKey, JSON.stringify(record));
      return { isLimitReached: false, remainingMs: 0, count: newLoadedCount };
    }

    localStorage.setItem(storageKey, JSON.stringify({ timestamp: record.timestamp, count: totalCount }));

    if (totalCount >= DAILY_FREE_PROFILE_LIMIT) {
      const remainingMs = Math.max(0, 86400000 - timeElapsed);
      return { isLimitReached: true, remainingMs, count: totalCount };
    }
  } catch (e) {}

  return { isLimitReached: false, remainingMs: 0, count: newLoadedCount };
}

export function getRemainingTimeForTab(tab: string = 'best-matches'): number {
  try {
    const storageKey = `daily_profile_views_tracker_${tab}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const remaining = 86400000 - (Date.now() - parsed.timestamp);
      return Math.max(0, remaining);
    }
  } catch (e) {}
  return 86400000;
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
