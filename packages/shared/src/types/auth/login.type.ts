import { AccountStatus, Role } from '../../constants';

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: {
    id: string;
    email: string;
    role: Role;
    status: AccountStatus;
  };
};
