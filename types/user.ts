export interface User {
  id: string;
  email: string;
  role: 'customer' | 'store_owner' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  profile: UserProfile;
  preferences?: UserPreferences;
}

export interface UserProfile {
  displayName: string;
  document: string; // CPF (obrigatório)
  phone?: string;
  birthDate?: string;
  photoURL?: string;
}

export interface UserPreferences {
  emailMarketing: boolean;
  smsNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// ✅ CORRIGIDO: Remover password da interface de criação
export interface CreateUserData {
  email: string;
  displayName: string;
  document: string; // CPF obrigatório
  phone?: string;
  role?: 'customer' | 'store_owner' | 'admin';
}