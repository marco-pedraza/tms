import { Gateway, Header } from 'encore.dev/api';
import { authHandler } from 'encore.dev/auth';
import { errors } from '../shared/errors';
import { authUseCases } from './auth/auth.use-cases';

interface AuthParams {
  authorization: Header<'Authorization'>;
}

interface AuthData {
  userID: string;
}

// Centralized error message for authentication failures
const INVALID_TOKEN_ERROR = 'Invalid token';

/**
 * Authentication handler that validates the Authorization header and returns the user data.
 * The header should be in the format "Bearer <token>" where token is a valid JWT.
 */
export const auth = authHandler<AuthParams, AuthData>(async (params) => {
  const authHeader = params.authorization;

  // Validate auth header exists
  if (!authHeader) {
    throw errors.unauthenticated(INVALID_TOKEN_ERROR);
  }

  // Validate auth header format
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    throw errors.unauthenticated(INVALID_TOKEN_ERROR);
  }

  try {
    // Verify the token and check user status using the users client
    const user = await authUseCases.validateTokenAndUser(token, 'access');

    return {
      userID: user.id.toString(),
    };
  } catch {
    throw errors.unauthenticated(INVALID_TOKEN_ERROR);
  }
});

export const gateway = new Gateway({
  authHandler: auth,
});
