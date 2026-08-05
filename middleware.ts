// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('user_token')?.value;
  const isProfileCompleted = request.cookies.get('is_profile_completed')?.value;
  const { pathname } = request.nextUrl;

  // 1. Static files, Next.js internal files, images aur API calls ko skip karein
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. CASE 1: Agar Token nahi hai (User Unauthenticated hai)
  if (!token) {
    // Agar user '/' ke alawa kisi aurprotected page par hai toh use '/' par bhej do
    if (pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. CASE 2: Token hai, ab Profile Status Check karein
  const isDone = isProfileCompleted === '1' || isProfileCompleted === 'true';

  if (!isDone) {
    // Profile complete nahi hai ('0' ya false) -> User ko sirf '/complete-profile' par rehna chahiye
    if (pathname !== '/complete-profile') {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  } else {
    // Profile complete hai ('1' ya true) -> Agar user '/' ya '/complete-profile' par hai, toh use '/dashboard' bhejo
    if (pathname === '/' || pathname === '/complete-profile') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};