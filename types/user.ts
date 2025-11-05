export interface User {
  id: string;
  email: string;
  role: 'customer' | 'store_owner' | 'admin';
  createdAt: Date;
  profile?: UserProfile;
}

export interface UserProfile {
  displayName?: string;
  photoURL?: string;
  phone?: string;
}