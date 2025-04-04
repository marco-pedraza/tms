import { Header, Gateway, APIError, ErrCode } from 'encore.dev/api';
import { authHandler } from 'encore.dev/auth';
import { authUseCases } from '../users/auth/auth.use-cases';
import { AuthenticationError } from '../shared/errors';
import { users } from "~encore/clients";

interface AuthParams {
  authorization: Header<'Authorization'>;
}

interface AuthData {
  userID: string;
}

/**
 * Authentication handler that validates the Authorization header and returns the user data.
 * The header should be in the format "Bearer <token>" where token is a valid JWT.
 */
export const auth = authHandler<AuthParams, AuthData>(async (params) => {
  const test = await users.listUsers();
  console.log({ test: test.users });
  const authHeader = params.authorization;

  // Validate auth header exists
  if (!authHeader) {
    throw new APIError(ErrCode.Unauthenticated, 'Missing authorization header');
  }

  // Validate auth header format
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    throw new APIError(
      ErrCode.Unauthenticated,
      "Invalid authorization header format. Expected 'Bearer <token>'",
    );
  }

  try {
    // Verify the token and check user status with the use case
    const user = await authUseCases.validateTokenAndUser(token, 'access');

    return {
      userID: user.id.toString()
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    if (error instanceof AuthenticationError) {
      throw new APIError(ErrCode.Unauthenticated, error.message);
    }
    throw new APIError(
      ErrCode.Unauthenticated,
      'Authentication failed: ' +
        (error instanceof Error ? error.message : 'Invalid token'),
    );
  }
});

export const gateway = new Gateway({
  authHandler: auth,
});
