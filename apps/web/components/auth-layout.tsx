'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/sidebar';
import { useSessionRedirect } from '@/hooks/use-session-redirect';
import { validateCallbackUrl } from '@/utils/validate-callback-url';

/**
 * Component that handles login page redirection using search params.
 * Must be wrapped in Suspense due to useSearchParams usage.
 */
function LoginRedirectHandler() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (status === 'authenticated' && pathname === '/auth/login') {
      const callbackUrl = searchParams.get('callbackUrl');
      const redirectUrl = validateCallbackUrl(callbackUrl);
      router.replace(redirectUrl);
    }
  }, [status, pathname, router, searchParams]);

  return null;
}

/**
 * Props for the AuthLayout component.
 */
interface AuthLayoutProps {
  /** Child components to render within the layout */
  children: React.ReactNode;
}

/**
 * Authentication-aware layout component that renders different layouts based on auth state.
 * Shows a loading spinner during authentication check, full-screen layout when unauthenticated,
 * and sidebar layout when authenticated.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const { data: session, status } = useSession();
  const t = useTranslations('common');
  const pathname = usePathname();

  // Handle automatic redirection when session becomes invalid
  useSessionRedirect();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Determine if we should show full-screen layout (no sidebar)
  const shouldShowFullScreen =
    !session || session.user?.invalid || pathname === '/auth/login';

  if (shouldShowFullScreen) {
    return (
      <div className="min-h-screen">
        <Suspense fallback={null}>
          <LoginRedirectHandler />
        </Suspense>
        {children}
      </div>
    );
  }

  // If authenticated, show sidebar layout
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      <aside className="w-64 border-r bg-background">
        <Sidebar />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
