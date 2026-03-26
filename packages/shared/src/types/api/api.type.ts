/** Token pair returned by the auth endpoints. */
export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

/** Standard API response shape returned by the backend. */
export type ApiResponse<T = unknown> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
};
