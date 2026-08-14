export const CDN_BASE_URL = "https://cdn.pakizarishte.com";

/**
 * Resolves a profile image URL cleanly whether it's relative ("profiles/abc.webp"),
 * absolute ("https://..."), or empty/null.
 */
export const getOptimizedImageUrl = (path?: string | null): string => {
  if (!path || path.trim() === '' || path === '/placeholder.png' || path === 'placeholder.png') {
    return '/placeholder.png';
  }

  const cleanPath = path.trim();

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }

  const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${CDN_BASE_URL}/${relative}`;
};
