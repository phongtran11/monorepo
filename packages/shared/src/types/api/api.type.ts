/** Token pair returned by the auth endpoints. */
export type TokenPair = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

/** Standard API response shape returned by the backend. */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
  path?: string;
  timestamp?: string;
};
