export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}