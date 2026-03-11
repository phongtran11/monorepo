export interface JwtPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  jti: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface RefreshAuthUser extends AuthUser {
  jti: string;
  refreshToken: string;
}
