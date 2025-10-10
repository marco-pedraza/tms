'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/sidebar';

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

  // If not authenticated, show full-screen layout (for login page)
  if (!session) {
    return <div className="min-h-screen">{children}</div>;
  }

  // If authenticated, show sidebar layout
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-background">
        <Sidebar />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
