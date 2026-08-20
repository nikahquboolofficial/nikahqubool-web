export const CDN_BASE_URL = "https://cdn.nikahqubool.com";

const FEMALE_DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80"
];

const MALE_DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80"
];

export const getFallbackPhoto = (userId: number = 1, gender: string = 'Female'): string => {
  const isFemale = (gender || 'Female').toLowerCase() === 'female';
  const list = isFemale ? FEMALE_DEMO_PHOTOS : MALE_DEMO_PHOTOS;
  return list[Math.abs(userId || 1) % list.length];
};

/**
 * Resolves a profile image URL cleanly whether it's relative ("profiles/abc.webp"),
 * absolute ("https://..."), or empty/null.
 */
export const getOptimizedImageUrl = (path?: string | null, userId: number = 1, gender: string = 'Female'): string => {
  if (!path || path.trim() === '' || path === '/placeholder.png' || path === 'placeholder.png') {
    return getFallbackPhoto(userId, gender);
  }

  const cleanPath = path.trim();

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:image/')) {
    return cleanPath;
  }

  const relative = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  return `${CDN_BASE_URL}/${relative}`;
};

