export const CDN_BASE_URL = "https://cdn.nikahqubool.in";

// 👤 Default Fallback Avatar Photos (Jab user ki photo Na ho)
export const getFallbackPhoto = (userId: number = 1, gender: string = 'Female'): string => {
  const isMale = gender?.toLowerCase() === 'male';
  return isMale ? '/default-avatar-male.png' : '/default-avatar-female.png';
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
  if (!path || path.trim() === '' || path === '/placeholder.png' || path === 'placeholder.png') {
    return getFallbackPhoto(userId, gender);
  }

  const cleanPath = path.trim();

  // Agar already full HTTP/HTTPS URL hai (jaise Google Auth photo ya external URL)
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }

  // Relative path (e.g. "user-profiles/abc.webp") ko Cloudflare CDN ke sath join karein
  const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${CDN_BASE_URL}/${relative}`;
};