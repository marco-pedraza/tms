import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessRoute, isPublicRoute } from '@/utils/permissions';

/**
 * Middleware to enforce authentication across routes using Auth.js
 * Redirects unauthenticated users to login and checks route permissions.
 * Preserves original request URL in callbackUrl parameter for deep linking support.
 */
const middleware = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn =
    !!req.auth && !!req.auth.user?.id && !req.auth.user?.invalid;

  // Allow public routes
  if (isPublicRoute(nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Allow unauthenticated access to all auth routes
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

  // Check if user has permission for this route
  const permissions = req.auth?.user?.permissions ?? [];
  const isSystemAdmin = req.auth?.user?.isSystemAdmin ?? false;

  if (!canAccessRoute(nextUrl.pathname, permissions, isSystemAdmin)) {
    // Redirect to access denied page for unauthorized access
    return NextResponse.redirect(new URL('/access-denied', nextUrl));
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
