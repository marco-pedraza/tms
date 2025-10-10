import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      refreshToken: string;
      firstName: string;
      lastName: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    firstName: string;
    lastName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string;
    refreshToken: string;
    firstName: string;
    lastName: string;
  }
}
