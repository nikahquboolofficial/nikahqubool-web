import { API_BASE_URL } from '@/lib/api';

export const CDN_BASE_URL = "https://cdn.nikahqubool.in";

// 👤 SVG Data URI Fallback Avatars (0% 404 Network Errors)
export const DEFAULT_MALE_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23475569'><rect width='100' height='100' fill='%231e293b'/><circle cx='50' cy='38' r='18' fill='%2364748b'/><path d='M25,82 C25,62 75,62 75,82' fill='%2364748b'/></svg>";
export const DEFAULT_FEMALE_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23e11d48'><rect width='100' height='100' fill='%231e293b'/><circle cx='50' cy='38' r='18' fill='%23f43f5e'/><path d='M25,82 C25,62 75,62 75,82' fill='%23f43f5e'/></svg>";

// 👤 Default Fallback Avatar Photos (Jab user ki photo Na ho)
export const getFallbackPhoto = (userId: number = 1, gender: string = 'Female'): string => {
  const isMale = gender?.toLowerCase() === 'male';
  return isMale ? DEFAULT_MALE_AVATAR : DEFAULT_FEMALE_AVATAR;
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

  // Relative path (e.g. "user-profiles/abc.webp") ko Cloudflare CDN ke sath join karein
  const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${CDN_BASE_URL}/${relative}`;
};