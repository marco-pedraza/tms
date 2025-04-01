import { Secret } from 'encore.dev/api';

export const JWT_SECRET = new Secret({
  name: 'JWT_SECRET',
  description: 'Secret key for signing JWT tokens',
});
