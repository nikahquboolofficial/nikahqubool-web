"use client";

// 🔒 Client-Side High-Speed Interaction Persistence Store
// Ensures Shortlist & Interest states survive page refreshes, tab switching & network delays

import { getAuthToken } from "@/lib/auth";

const SHORTLIST_STORAGE_KEY_PREFIX = "persisted_shortlist_";
const INTEREST_STORAGE_KEY_PREFIX = "persisted_interest_";

export function getCurrentUserId(): number {
  if (typeof window === "undefined") return 0;
  try {
    for (const key of ["user_details", "user_session", "cached_profile_details"]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const u = JSON.parse(raw);
        const id = Number(u.userId || u.UserId || u.id || u.Id || 0);
        if (id > 0) return id;
      }
    }
    // Also try decoding from JWT token if available
    const token = getAuthToken();
    if (token && token.includes(".")) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const id = Number(
          payload.userId || payload.UserId || payload.id || payload.Id ||
          payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 0
        );
        if (id > 0) return id;
      }
    }
  } catch (e) {}
  return 0;
}

export function saveShortlistState(targetUserId: number, isShortlisted: boolean): void {
  if (typeof window === "undefined" || !targetUserId) return;
  const currentUserId = getCurrentUserId();
  const keys = [
    `${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`,
    `${SHORTLIST_STORAGE_KEY_PREFIX}active`
  ];
  keys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      const map: Record<number, boolean> = raw ? JSON.parse(raw) : {};
      map[targetUserId] = isShortlisted;
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
  });
}

export function saveInterestSentState(targetUserId: number): void {
  if (typeof window === "undefined" || !targetUserId) return;
  const currentUserId = getCurrentUserId();
  const keys = [
    `${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`,
    `${INTEREST_STORAGE_KEY_PREFIX}active`
  ];
  keys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      const map: Record<number, boolean> = raw ? JSON.parse(raw) : {};
      map[targetUserId] = true;
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
  });
}

export function applyPersistedInteractions<T extends Record<string, any>>(profiles: T[]): T[] {
  if (typeof window === "undefined" || !Array.isArray(profiles) || profiles.length === 0) {
    return profiles;
  }

  const currentUserId = getCurrentUserId();
  let shortlistMap: Record<number, boolean> = {};
  let interestMap: Record<number, boolean> = {};

  try {
    const sRaw = localStorage.getItem(`${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`) || localStorage.getItem(`${SHORTLIST_STORAGE_KEY_PREFIX}active`);
    if (sRaw) shortlistMap = JSON.parse(sRaw);
  } catch (e) {}

  try {
    const iRaw = localStorage.getItem(`${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`) || localStorage.getItem(`${INTEREST_STORAGE_KEY_PREFIX}active`);
    if (iRaw) interestMap = JSON.parse(iRaw);
  } catch (e) {}

  return profiles.map((p) => {
    const uId = Number(p.userId || p.UserId || 0);
    if (!uId) return p;

    let isShort = Boolean(p.isShortlisted || p.IsShortlisted);
    let isIntSent = Boolean(
      p.isInterestSent || p.IsInterestSent || p.hasSentInterest ||
      p.interestStatus === 'SentPending' || p.interestStatus === 'Sent' || p.interestStatus === 'SENT'
    );
    let intStatus = p.interestStatus || p.InterestStatus || 'None';

    // Apply Shortlist override if present in local persistent store
    if (shortlistMap[uId] !== undefined) {
      isShort = Boolean(shortlistMap[uId]);
    } else if (isShort) {
      // Sync from DB truth into store
      shortlistMap[uId] = true;
      try {
        localStorage.setItem(`${SHORTLIST_STORAGE_KEY_PREFIX}${currentUserId}`, JSON.stringify(shortlistMap));
        localStorage.setItem(`${SHORTLIST_STORAGE_KEY_PREFIX}active`, JSON.stringify(shortlistMap));
      } catch (e) {}
    }

    // Apply Interest override if present in local persistent store
    if (interestMap[uId]) {
      isIntSent = true;
      if (intStatus === 'None' || !intStatus || intStatus === '') {
        intStatus = 'SentPending';
      }
    } else if (isIntSent) {
      // Sync from DB truth into store
      interestMap[uId] = true;
      try {
        localStorage.setItem(`${INTEREST_STORAGE_KEY_PREFIX}${currentUserId}`, JSON.stringify(interestMap));
        localStorage.setItem(`${INTEREST_STORAGE_KEY_PREFIX}active`, JSON.stringify(interestMap));
      } catch (e) {}
    }

    return {
      ...p,
      isShortlisted: isShort,
      IsShortlisted: isShort,
      isInterestSent: isIntSent,
      IsInterestSent: isIntSent,
      hasSentInterest: isIntSent,
      interestStatus: intStatus,
      InterestStatus: intStatus
    };
  });
}
