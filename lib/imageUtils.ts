import { API_BASE_URL } from '@/lib/api';

export const CDN_BASE_URL = "https://cdn.nikahqubool.in";

// 👤 PREMIUM VECTOR SILHOUETTE AVATARS (Clean, Elegant, Zero Network Requests)
export const DEFAULT_MALE_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160' width='160' height='160'><defs><linearGradient id='bgM' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23F8FAFC'/><stop offset='100%25' stop-color='%23E2E8F0'/></linearGradient><linearGradient id='silM' x1='0%25' y1='0%25' x2='0%25' y2='100%25'><stop offset='0%25' stop-color='%2394A3B8'/><stop offset='100%25' stop-color='%2364748B'/></linearGradient></defs><rect width='160' height='160' fill='url(%23bgM)'/><circle cx='80' cy='62' r='28' fill='url(%23silM)'/><path d='M36,142 C36,110 55,98 80,98 C105,98 124,110 124,142 C124,148 120,152 112,152 L48,152 C40,152 36,148 36,142 Z' fill='url(%23silM)'/><path d='M74,98 L80,107 L86,98 Z' fill='%23F8FAFC' opacity='0.8'/></svg>";

export const DEFAULT_FEMALE_AVATAR = DEFAULT_MALE_AVATAR;

// 👤 Default Fallback Avatar Photos (Gender-Specific)
export const getFallbackPhoto = (userId: number = 1, gender: string = 'Male'): string => {
  return DEFAULT_MALE_AVATAR;
};

/**
 * Resolves a profile image URL cleanly whether it's relative ("user-profiles/abc.webp"),
 * absolute ("https://..."), or empty/null.
 */
export const getOptimizedImageUrl = (
  path?: string | null,
  userId: number = 1,
  gender: string = 'Female'
): string => {
  if (!path || path.trim() === '' || path === '/placeholder.png' || path === 'placeholder.png' || path === 'null' || path === 'undefined') {
    return getFallbackPhoto(userId, gender);
  }

  const cleanPath = path.trim();

  // If already absolute URL or data URI, return as-is immediately!
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }

  // Relative path (e.g. "user-profiles/abc.webp") joined with Cloudflare CDN
  const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${CDN_BASE_URL}/${relative}`;
};

export const getBlurredPhotoUrl = (
  path?: string | null,
  userId: number = 1,
  gender: string = 'Female'
): string => {
  return getOptimizedImageUrl(path, userId, gender);
};
