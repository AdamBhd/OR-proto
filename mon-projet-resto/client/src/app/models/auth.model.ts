export type UserRole = 'ADMIN' | 'OWNER' | 'CUSTOMER';

export interface AuthUser {
  _id: string;
  email: string;
  displayName: string;
  role: UserRole;
  restaurantId?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
