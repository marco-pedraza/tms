import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import type { permissions, roles } from '@repo/ims-client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      refreshToken: string;
      firstName: string;
      lastName: string;
      isSystemAdmin: boolean;
      permissions: permissions.Permission[];
      invalid?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    firstName: string;
    lastName: string;
    isSystemAdmin: boolean;
    permissions: permissions.Permission[];
    roles: roles.Role[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string;
    refreshToken: string;
    firstName: string;
    lastName: string;
    isSystemAdmin: boolean;
    permissions: permissions.Permission[];
    expiry?: number;
    invalid?: boolean;
  }
}
