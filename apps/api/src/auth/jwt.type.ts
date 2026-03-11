import {
  AccountStatus,
  Permission,
  Role,
} from '@lam-thinh-ecommerce/shared/constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  status: AccountStatus;
}

export interface RefreshTokenPayload extends JwtPayload {
  jti: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
}

export interface RefreshAuthUser extends AuthUser {
  jti: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}

export interface RefreshAuthRequest extends Request {
  user: RefreshAuthUser;
}
