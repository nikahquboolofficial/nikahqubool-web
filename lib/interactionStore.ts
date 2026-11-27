"use client";

// 🔒 Client-Side High-Speed Interaction Persistence Store
// Ensures Shortlist & Interest states survive page refreshes, tab switching & network delays

const SHORTLIST_STORAGE_KEY_PREFIX = "persisted_shortlist_";
const INTEREST_STORAGE_KEY_PREFIX = "persisted_interest_";

function getCurrentUserId(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("user_details") || localStorage.getItem("user_session");
    if (raw) {
      const u = JSON.parse(raw);
      return Number(u.userId || u.UserId || u.id || 0);
    }
  } catch (e) {}
  return 0;
}

export function saveShortlistState(targetUserId: number, isShortlisted: boolean): void {
  if (typeof window === "undefined" || !targetUserId) return;
  const currentUserId = getCurrentUserId();
  const key = `${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`;
  try {
    const raw = localStorage.getItem(key);
    const map: Record<number, boolean> = raw ? JSON.parse(raw) : {};
    if (isShortlisted) {
      map[targetUserId] = true;
    } else {
      delete map[targetUserId];
    }
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {}
}

export function saveInterestSentState(targetUserId: number): void {
  if (typeof window === "undefined" || !targetUserId) return;
  const currentUserId = getCurrentUserId();
  const key = `${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`;
  try {
    const raw = localStorage.getItem(key);
    const map: Record<number, boolean> = raw ? JSON.parse(raw) : {};
    map[targetUserId] = true;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {}
}

export function applyPersistedInteractions<T extends Record<string, any>>(profiles: T[]): T[] {
  if (typeof window === "undefined" || !Array.isArray(profiles) || profiles.length === 0) {
    return profiles;
  }

  const currentUserId = getCurrentUserId();
  let shortlistMap: Record<number, boolean> = {};
  let interestMap: Record<number, boolean> = {};

  try {
    const sRaw = localStorage.getItem(`${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`);
    if (sRaw) shortlistMap = JSON.parse(sRaw);
  } catch (e) {}

  try {
    const iRaw = localStorage.getItem(`${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`);
    if (iRaw) interestMap = JSON.parse(iRaw);
  } catch (e) {}

  return profiles.map((p) => {
    const uId = Number(p.userId || p.UserId || 0);
    if (!uId) return p;

    let modified = false;
    let isShort = Boolean(p.isShortlisted || p.IsShortlisted);
    let isIntSent = Boolean(
      p.isInterestSent || p.IsInterestSent ||
      p.interestStatus === 'SentPending' || p.interestStatus === 'Sent' || p.interestStatus === 'SENT'
    );
    let intStatus = p.interestStatus || p.InterestStatus || 'None';

    // Apply Shortlist override if present in local persistent store
    if (shortlistMap[uId] !== undefined) {
      isShort = Boolean(shortlistMap[uId]);
      modified = true;
    } else if (isShort) {
      // Sync from DB truth into store
      shortlistMap[uId] = true;
      try {
        localStorage.setItem(`${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`, JSON.stringify(shortlistMap));
      } catch (e) {}
    }

    // Apply Interest override if present in local persistent store
    if (interestMap[uId]) {
      isIntSent = true;
      if (intStatus === 'None' || !intStatus) {
        intStatus = 'SentPending';
      }
      modified = true;
    } else if (isIntSent) {
      // Sync from DB truth into store
      interestMap[uId] = true;
      try {
        localStorage.setItem(`${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`, JSON.stringify(interestMap));
      } catch (e) {}
    }

    if (!modified) return p;

    return {
      ...p,
      isShortlisted: isShort,
      IsShortlisted: isShort,
      isInterestSent: isIntSent,
      IsInterestSent: isIntSent,
      interestStatus: intStatus,
      InterestStatus: intStatus
    };
  });
}
