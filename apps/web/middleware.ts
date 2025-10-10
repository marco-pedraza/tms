import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateCallbackUrl } from '@/utils/validate-callback-url';

/**
 * Middleware to enforce authentication across routes using Auth.js
 * Redirects unauthenticated users to login and authenticated users away from login page.
 * Preserves original request URL in callbackUrl parameter for deep linking support.
 */
const middleware = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Handle /auth/login specially - redirect authenticated users to callback URL or app root
  if (nextUrl.pathname === '/auth/login' && isLoggedIn) {
    const callbackUrl = nextUrl.searchParams.get('callbackUrl');
    const redirectUrl = validateCallbackUrl(callbackUrl);
    return NextResponse.redirect(new URL(redirectUrl, nextUrl));
  }

  // Allow unauthenticated access to all other auth routes
  if (nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // For non-auth routes, redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL('/auth/login', nextUrl);
    // Preserve the original URL (pathname + search + hash) as callbackUrl
    const originalUrl = nextUrl.pathname + nextUrl.search + nextUrl.hash;
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(originalUrl));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default middleware as unknown as ReturnType<typeof auth>;

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
