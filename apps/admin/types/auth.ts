export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: {
    id: string;
    email: string;
    role: number;
    status: number;
  };
};
