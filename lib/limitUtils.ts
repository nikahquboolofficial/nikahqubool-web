export interface DailyLimitState {
  isLimitReached: boolean;
  remainingMs: number;
  count: number;
}

export function checkDailyViewLimit(newLoadedCount: number, isPaidParam: boolean): DailyLimitState {
  let isPaid = isPaidParam;

  if (!isPaid && typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.isPaid || parsed.IsPaid || parsed.isCurrentUserPaid || parsed.IsCurrentUserPaid || parsed.isPremium || parsed.IsPremium) {
          isPaid = true;
        }
      }
    } catch (e) {}
  }

  if (isPaid) {
    return { isLimitReached: false, remainingMs: 0, count: 0 };
  }

  try {
    const now = Date.now();
    const storageKey = 'daily_profile_views_tracker';
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

    if (totalCount >= 20) {
      const remainingMs = Math.max(0, 86400000 - timeElapsed);
      return { isLimitReached: true, remainingMs, count: totalCount };
    }
  } catch (e) {}

  return { isLimitReached: false, remainingMs: 0, count: newLoadedCount };
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
