import NextAuth from 'next-auth';
import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { auth as AuthTypes, permissions } from '@repo/ims-client';
import { publicClient } from '@/services/ims-client';

/**
 * Decodes a JWT token and extracts the expiration timestamp
 * @param token - The JWT token to decode
 * @returns The expiration timestamp in seconds, or null if invalid
 */
function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadPart = parts[1];
    if (!payloadPart) return null;

    // Convert base64url to base64 before decoding
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp || null;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The JWT token to check
 * @returns True if the token is expired or invalid
 */
function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return true;

  // Add 5 minute buffer to refresh before actual expiration
  const bufferTime = 5 * 60; // 5 minutes in seconds
  return Date.now() / 1000 >= exp - bufferTime;
}

/**
 * Auth.js configuration for Next.js authentication
 * Uses credentials provider to integrate with existing IMS API
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Use public client for login (no auth required)
          const response = (await publicClient.users.login({
            username: credentials.username as string,
            password: credentials.password as string,
          })) as AuthTypes.LoginResponse;

          if (response.user && response.accessToken) {
            return {
              id: response.user.id.toString(),
              email: response.user.email,
              name: `${response.user.firstName} ${response.user.lastName}`,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              isSystemAdmin: response.user.isSystemAdmin,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              permissions: response.permissions,
              roles: response.roles,
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist the access token and refresh token to the token right after signin
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isSystemAdmin = user.isSystemAdmin;
        token.permissions = user.permissions;
        return token;
      }

      // Check if access token is expired and refresh if needed
      if (token.accessToken && token.refreshToken) {
        const accessToken = token.accessToken as string;
        const refreshToken = token.refreshToken as string;

        if (isTokenExpired(accessToken)) {
          try {
            // Use public client for token refresh (no auth required)
            const response = await publicClient.users.refreshToken({
              refreshToken: refreshToken,
            });

            // Update tokens with new values
            token.accessToken = response.accessToken;
            token.refreshToken = response.refreshToken;

            // Store expiration timestamp for future checks
            const exp = getTokenExpiration(response.accessToken);
            if (exp) {
              token.expiry = exp;
            }
          } catch {
            // If refresh fails, mark token as invalid but keep structure
            token.accessToken = '';
            token.refreshToken = '';
            token.expiry = undefined;
            token.invalid = true;
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub ?? '';
        session.user.firstName = (token.firstName as string | undefined) ?? '';
        session.user.lastName = (token.lastName as string | undefined) ?? '';
        session.user.isSystemAdmin = (token.isSystemAdmin as boolean) ?? false;
        session.user.permissions =
          (token.permissions as permissions.Permission[]) ?? [];
        // Pass the invalid flag to the session
        session.user.invalid = token.invalid;
        // Pass the access token to the session for API calls
        session.user.accessToken = (token.accessToken as string) ?? '';
      }
      return session;
    },
  },
  events: {
    async signOut(params) {
      // Call the server logout endpoint when user signs out
      if ('token' in params && params.token?.refreshToken) {
        try {
          // Use public client for logout (no auth required)
          await publicClient.users.logout({
            refreshToken: params.token.refreshToken as string,
          });
        } catch {
          // Log error but don't prevent logout
          console.error('Failed to logout on server');
        }
      }
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === 'development'
      ? 'dev-secret'
      : (() => {
          throw new Error('AUTH_SECRET environment variable is required');
        })()),
};

const nextAuth = NextAuth(authConfig);

// Export NextAuth functions and handlers with explicit types
export const auth: typeof nextAuth.auth = nextAuth.auth;
export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;

// Export the configuration as default for NextAuth
export default authConfig;
