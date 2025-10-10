'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { validateCallbackUrl } from '@/utils/validate-callback-url';
import LoginForm from './components/login-form';

/**
 * Login page component with form validation and error handling.
 * The middleware handles authentication redirects automatically.
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const tAuth = useTranslations('auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl');

  /**
   * Handles login form submission using Auth.js signIn
   */
  const handleLogin = (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    setError(undefined);

    signIn('credentials', {
      username: credentials.username,
      password: credentials.password,
      redirect: false,
    })
      .then((result) => {
        if (result?.error) {
          setError(tAuth('errors.invalidCredentials'));
        } else if (result?.ok) {
          // Login successful - redirect to validated callback URL or home
          const redirectUrl = validateCallbackUrl(callbackUrl);
          router.push(redirectUrl);
        }
      })
      .catch(() => {
        setError(tAuth('errors.loginFailed'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">IMS.ai</h1>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12">
          <LoginForm
            onSubmit={handleLogin}
            error={error}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
