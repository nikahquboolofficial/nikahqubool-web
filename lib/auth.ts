export const setAuthCookies = (result: any) => {
  const days = 7;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isCompleted = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");
  const profileCompletedVal = isCompleted ? '1' : '0';

  document.cookie = `user_token=${result.token}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  document.cookie = `is_profile_completed=${profileCompletedVal}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

export const handleAuthSuccessRedirect = (result: any, router: any) => {
  setAuthCookies(result);
  const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
  const isProfileDone = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");

  // Smooth SPA Navigation without page refresh (no white blink)
  if (isProfileDone) {
    router.push('/dashboard');
  } else {
    router.push('/complete-profile');
  }
};