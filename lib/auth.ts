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
  const token = result?.token ?? result?.Token;
  if (!token) return;

  const days = 14;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isCompleted = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");
  const profileCompletedVal = isCompleted ? '1' : '0';

  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `user_token=${token}; expires=${expires}; path=/; SameSite=Lax${isSecure}`;
  document.cookie = `is_profile_completed=${profileCompletedVal}; expires=${expires}; path=/; SameSite=Lax${isSecure}`;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("user_token", token);
      localStorage.setItem("user_details", JSON.stringify(result));
      localStorage.setItem("user_session", JSON.stringify(result));
      localStorage.setItem("is_profile_completed", profileCompletedVal);
    } catch (e) {}
  }
};

export const clearAuthCookies = () => {
  document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "is_profile_completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  if (typeof window !== "undefined") {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_details");
    localStorage.removeItem("user_session");
    localStorage.removeItem("is_profile_completed");
    sessionStorage.clear();
  }
};

export const handleAuthSuccessRedirect = (result: any, router: any) => {
  setAuthCookies(result);
  const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isProfileDone = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");

  if (isProfileDone) {
    router.push('/dashboard');
  } else {
    router.push('/complete-profile');
  }
};

/**
 * ⚡ Synchronizes a new or updated profile photo everywhere across the application:
 * 1. Updates 'user_details' in localStorage
 * 2. Updates 'user_session' in localStorage
 * 3. Triggers window event 'user_photo_updated' so DashboardBottomNav, DashboardHeader, and components update in real-time
 */
export const syncUserProfilePhoto = (photoUrl: string) => {
  if (!photoUrl || typeof window === "undefined") return;
  try {
    ['user_details', 'user_session'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.mainPhotoUrl = photoUrl;
          parsed.photoUrl = photoUrl;
          parsed.PhotoUrl = photoUrl;
          parsed.mainPhoto = photoUrl;
          parsed.photo = photoUrl;
          localStorage.setItem(key, JSON.stringify(parsed));
        } catch (e) {}
      }
    });

    // Broadcast standard event and detail event for listeners
    window.dispatchEvent(new CustomEvent("user_photo_updated", { detail: { photoUrl } }));
    window.dispatchEvent(new Event("user_photo_updated"));
  } catch (err) {}
};
