export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // 1. Try Cookie
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; user_token=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      if (val && val !== 'undefined' && val !== 'null' && val.length > 10) return val;
    }
  } catch (e) {}

  // 2. Try localStorage user_token
  try {
    const localToken = localStorage.getItem("user_token");
    if (localToken && localToken !== 'undefined' && localToken !== 'null' && localToken.length > 10) return localToken;
  } catch (e) {}

  // 3. Try localStorage user_details
  try {
    const details = localStorage.getItem("user_details");
    if (details) {
      const parsed = JSON.parse(details);
      const t = parsed?.token || parsed?.Token;
      if (t && t !== 'undefined' && t !== 'null' && t.length > 10) return t;
    }
  } catch (e) {}

  // 4. Try localStorage user_session
  try {
    const session = localStorage.getItem("user_session");
    if (session) {
      const parsed = JSON.parse(session);
      const t = parsed?.token || parsed?.Token;
      if (t && t !== 'undefined' && t !== 'null' && t.length > 10) return t;
    }
  } catch (e) {}

  return null;
};

export const setAuthCookies = (result: any) => {
  if (!result) return;
  const rawData = result?.data ?? result?.Data ?? result;
  const token = result?.token ?? result?.Token ?? rawData?.token ?? rawData?.Token;
  if (!token) return;

  const days = 14;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isCompletedRaw = rawData?.isProfileCompleted ?? rawData?.IsProfileCompleted ?? result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isCompleted = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");
  const profileCompletedVal = isCompleted ? '1' : '0';

  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

  // 🛡️ Completely wipe all old conflicting session, profile & user cache to ensure 100% clean account switch
  if (typeof window !== "undefined") {
    try {
      const keysToPurge = [
        "user_token",
        "user_details",
        "user_session",
        "is_profile_completed",
        "cached_profile_details",
        "active_subscription",
        "cached_chat_inbox",
        "viewing_profile_target",
        "daily_profile_views_tracker",
        "unlocked_contact_profiles",
        "cache_profile_options",
        "read_notifications"
      ];
      keysToPurge.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {}
  }

  document.cookie = `user_token=${token}; expires=${expires}; path=/; SameSite=Lax${isSecure}`;
  document.cookie = `is_profile_completed=${profileCompletedVal}; expires=${expires}; path=/; SameSite=Lax${isSecure}`;

  const userDetailsObj = (rawData?.userId || rawData?.UserId) ? rawData : (result?.userId || result?.UserId) ? result : { ...rawData, ...result, token };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("user_token", token);
      localStorage.setItem("user_details", JSON.stringify(userDetailsObj));
      localStorage.setItem("user_session", JSON.stringify(userDetailsObj));
      localStorage.setItem("is_profile_completed", profileCompletedVal);
    } catch (e) {}
  }
};

export const clearAuthCookies = () => {
  // Wipe cookies with immediate expiration on path=/
  document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
  document.cookie = "is_profile_completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
  document.cookie = "user_token=; max-age=0; path=/;";
  document.cookie = "is_profile_completed=; max-age=0; path=/;";

  if (typeof window !== "undefined") {
    try {
      const keysToPurge = [
        "user_token",
        "user_details",
        "user_session",
        "is_profile_completed",
        "cached_profile_details",
        "active_subscription",
        "cached_chat_inbox",
        "viewing_profile_target",
        "daily_profile_views_tracker",
        "unlocked_contact_profiles",
        "cache_profile_options",
        "read_notifications"
      ];
      keysToPurge.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {}
  }
};

export const handleAuthSuccessRedirect = (result: any, router: any) => {
  setAuthCookies(result);
  const rawData = result?.data ?? result?.Data ?? result;
  const isCompletedRaw = rawData?.isProfileCompleted ?? rawData?.IsProfileCompleted ?? result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isProfileDone = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");

  if (isProfileDone) {
    if (typeof window !== "undefined") {
      window.location.href = '/dashboard';
    } else {
      router.push('/dashboard');
    }
  } else {
    // 🔒 New or Incomplete Profile: Direct hard redirect to complete profile
    if (typeof window !== "undefined") {
      window.location.href = '/complete-profile';
    } else {
      router.push('/complete-profile');
    }
  }
};

/**
 * ⚡ Ultra-fast 0ms Synchronous User Photo Resolver
 * Instantly retrieves the authentic photo for the currently logged-in user.
 * If user has no photo, returns the professional vector avatar without leaking old user cache.
 */
export const getStoredUserPhoto = (): string => {
  const neutralAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160' width='160' height='160'><defs><linearGradient id='bgM' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23F8FAFC'/><stop offset='100%25' stop-color='%23E2E8F0'/></linearGradient><linearGradient id='silM' x1='0%25' y1='0%25' x2='0%25' y2='100%25'><stop offset='0%25' stop-color='%2394A3B8'/><stop offset='100%25' stop-color='%2364748B'/></linearGradient></defs><rect width='160' height='160' fill='url(%23bgM)'/><circle cx='80' cy='62' r='28' fill='url(%23silM)'/><path d='M36,142 C36,110 55,98 80,98 C105,98 124,110 124,142 C124,148 120,152 112,152 L48,152 C40,152 36,148 36,142 Z' fill='url(%23silM)'/><path d='M74,98 L80,107 L86,98 Z' fill='%23F8FAFC' opacity='0.8'/></svg>";
  if (typeof window === "undefined") {
    return neutralAvatar;
  }
  try {
    for (const key of ['user_details', 'user_session', 'cached_profile_details']) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const p = parsed.profile || parsed.Profile || parsed.data?.profile || parsed.data || parsed;
        const rawPhoto = p?.mainPhotoUrl || p?.photoUrl || p?.PhotoUrl || p?.mainPhoto || p?.photo;
        if (rawPhoto && rawPhoto !== '/placeholder.png' && rawPhoto !== 'placeholder.png' && !String(rawPhoto).includes('default') && !String(rawPhoto).startsWith('data:image')) {
          const cleanPath = String(rawPhoto).trim();
          if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
          const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
          return `https://cdn.nikahqubool.in/${relative}`;
        }
      }
    }
  } catch (e) {}

  return neutralAvatar;
};

/**
 * ⚡ Synchronizes a new or updated profile photo everywhere across the application:
 * 1. Updates 'user_details', 'user_session', and 'cached_profile_details' in localStorage
 * 2. Triggers window event 'user_photo_updated' so DashboardBottomNav, DashboardHeader, EditProfile, and MyProfile update in real-time
 */
export const syncUserProfilePhoto = (photoUrl: string) => {
  if (!photoUrl || typeof window === "undefined") return;
  try {
    ['user_details', 'user_session', 'cached_profile_details'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.mainPhotoUrl = photoUrl;
          parsed.photoUrl = photoUrl;
          parsed.PhotoUrl = photoUrl;
          parsed.mainPhoto = photoUrl;
          parsed.photo = photoUrl;
          if (parsed.profile && typeof parsed.profile === 'object') {
            parsed.profile.mainPhotoUrl = photoUrl;
            parsed.profile.photoUrl = photoUrl;
          }
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch (e) {}
      }
    });

    // Broadcast standard event and detail event for listeners
    window.dispatchEvent(new CustomEvent("user_photo_updated", { detail: { photoUrl } }));
    window.dispatchEvent(new Event("user_photo_updated"));
  } catch (err) {}
};
