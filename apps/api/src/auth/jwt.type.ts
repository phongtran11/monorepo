import { AccountStatus, Role } from '@lam-thinh-ecommerce/shared';

/**
 * Payload structure of the Access Token.
 */
export interface JwtPayload {
  /**
   * Subject (User ID).
   */
  sub: string;
  /**
   * User's email address.
   */
  email: string;
  /**
   * User's assigned role.
   */
  role: Role;
  /**
   * Current account status.
   */
  status: AccountStatus;
}

/**
 * Payload structure of the Refresh Token, extending the standard JWT payload with a JTI.
 */
export interface RefreshTokenPayload extends JwtPayload {
  /**
   * JWT ID (Unique identifier for the session/token).
   */
  jti: string;
}

/**
 * Representation of the authenticated user in the system.
 */
export interface AuthUser {
  /**
   * User's unique identifier.
   */
  id: string;
  /**
   * User's email address.
   */
  email: string;
  /**
   * User's assigned role.
   */
  role: Role;
  /**
   * Current account status.
   */
  status: AccountStatus;
}

/**
 * Representation of the authenticated user during refresh token validation.
 */
export interface RefreshAuthUser extends AuthUser {
  /**
   * Unique session identifier (JTI).
   */
  jti: string;
  /**
   * The raw refresh token string.
   */
  refreshToken: string;
}

/**
 * Augmented Request object that includes the authenticated user.
 */
export interface AuthRequest extends Request {
  /**
   * The authenticated user attached to the request.
   */
  user: AuthUser;
}

/**
 * Augmented Request object for refresh token flows.
 */
export interface RefreshAuthRequest extends Request {
  /**
   * The authenticated refresh user attached to the request.
   */
  user: RefreshAuthUser;
}
