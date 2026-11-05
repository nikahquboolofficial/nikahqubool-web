import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ⚡ Ultra-fast (<0.01ms) In-Memory JWT Payload Decoder
 * Decodes claims directly without external libraries or API calls
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('user_token')?.value;
  const cookieProfileStatus = request.cookies.get('is_profile_completed')?.value;
  const { pathname } = request.nextUrl;

  // 1. Static files, Next.js internal files, images aur API calls ko skip karein
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public pages list (Sabhi users ke liye accessible)
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/about-us',
    '/contact-us',
    '/faq',
    '/privacy-policy',
    '/safety-tips',
    '/terms-conditions'
  ];

  const isPublicRoute = 
    publicRoutes.includes(pathname) || 
    pathname.startsWith('/matrimony') ||
    pathname.startsWith('/refund-policy') ||
    pathname.startsWith('/pricing-policy');

  // 2. CASE 1: Agar Token nahi hai (User Unauthenticated hai)
  if (!token) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Decode Token Claims (Zero API Hit, Zero Network Overhead)
  const payload = decodeJwtPayload(token);
  const tokenProfileStatus = payload?.IsProfileCompleted ?? payload?.isProfileCompleted;

  // 🛡️ CRITICAL AUTH LOGIC:
  const isCookieIncomplete = cookieProfileStatus === '0' || cookieProfileStatus === 'false';
  const isCookieDone = cookieProfileStatus === '1' || cookieProfileStatus === 'true';
  const isTokenDone = tokenProfileStatus === '1' || tokenProfileStatus === 'true' || tokenProfileStatus === true;

  // If cookie explicitly flags profile as incomplete ('0' / 'false'), user MUST complete profile first!
  const isDone = isCookieIncomplete ? false : (isTokenDone || isCookieDone);

  if (!isDone) {
    // 🔒 Profile incomplete: User can ONLY stay on '/complete-profile'
    if (pathname !== '/complete-profile') {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  } else {
    // 🔒 Profile complete: User can NEVER open '/', '/login', '/register' or '/complete-profile'
    if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/complete-profile') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};