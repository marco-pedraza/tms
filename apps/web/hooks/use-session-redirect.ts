import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Hook to handle automatic redirection when session becomes invalid
 * Monitors session state and redirects to login when token is invalid
 */
export function useSessionRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only act when session is loaded and user is present
    if (status === 'loading') return;

    // If session exists but is marked as invalid, redirect to login
    if (session?.user?.invalid) {
      router.push('/auth/login');
    }
  }, [session?.user?.invalid, status, router]);
}
