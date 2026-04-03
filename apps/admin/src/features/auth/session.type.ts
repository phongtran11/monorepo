export interface UserProfile {
  id: string;
  email: string;
  role: number;
  status: number;
  permissions: string[];
}

export interface Session {
  user: UserProfile;
}
