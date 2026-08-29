import { ShippingAddress } from './order';

export type UserRole = 'customer' | 'admin' | 'vendor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  addresses: ShippingAddress[];
  defaultShippingAddressIndex?: number;
  wishlistProductIds: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}
