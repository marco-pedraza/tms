import { MinLen } from 'encore.dev/validate';
import { SafeUser } from '../users/users.types';

/**
 * Login request payload
 */
export interface LoginPayload {
  /**
   * Username for login
   */
  username: string & MinLen<1>;

  /**
   * Password for authentication
   */
  password: string & MinLen<1>;
}

/**
 * Login response containing user data and authentication tokens
 */
export interface LoginResponse {
  /**
   * User data without sensitive information
   */
  user: SafeUser;
  
  /**
   * JWT access token
   */
  accessToken: string;
  
  /**
   * JWT refresh token
   */
  refreshToken: string;
}

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  /**
   * User ID
   */
  sub: number;
  
  /**
   * Tenant ID
   */
  tenantId: number;
  
  /**
   * Username
   */
  username: string;
  
  /**
   * Whether user is a system admin
   */
  isSystemAdmin: boolean;
  
  /**
   * Token type: 'access' or 'refresh'
   */
  type: 'access' | 'refresh';
  
  /**
   * Issued at timestamp
   */
  iat?: number;
  
  /**
   * Expiration timestamp
   */
  exp?: number;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenPayload {
  /**
   * Refresh token
   */
  refreshToken: string & MinLen<1>;
}

/**
 * Logout request payload
 */
export interface LogoutPayload {
  /**
   * Refresh token to invalidate
   */
  refreshToken: string & MinLen<1>;
}

/**
 * Stored refresh token entity
 */
export interface RefreshToken {
  /**
   * Unique identifier for the refresh token
   */
  id: number;
  
  /**
   * User ID the token belongs to
   */
  userId: number;
  
  /**
   * JWT refresh token string
   */
  token: string;
  
  /**
   * Timestamp when the token expires
   */
  expiresAt: Date;
  
  /**
   * Whether the token has been revoked
   */
  isRevoked: boolean;
  
  /**
   * Timestamp when the token was created
   */
  createdAt: Date | null;
}

/**
 * Data required to create a refresh token
 */
export interface CreateRefreshToken {
  /**
   * User ID the token belongs to
   */
  userId: number;
  
  /**
   * JWT refresh token string
   */
  token: string;
  
  /**
   * Timestamp when the token expires
   */
  expiresAt: Date;
  
  /**
   * Whether the token is revoked
   * @default false
   */
  isRevoked?: boolean;
}

/**
 * Data for updating a refresh token
 */
export interface UpdateRefreshToken {
  /**
   * Whether the token is revoked
   */
  isRevoked?: boolean;
} 