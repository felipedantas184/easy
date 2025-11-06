export interface Store {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  description?: string;
  theme: StoreTheme;
  contact: StoreContact;
  settings: StoreSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logo?: string;
}

export interface StoreContact {
  email: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  pixKeys?: PixKey[];
}

export interface PixKey {
  id: string;
  key: string;
  type: 'email' | 'phone' | 'cpf' | 'cnpj' | 'random';
  isActive: boolean;
  description?: string;
  createdAt: Date;
}

export interface StoreSettings {
  allowPickup: boolean;
  requireCustomerAuth: boolean;
  orderConfirmationMessage?: string;
  maintenanceMode: boolean;
  pixSettings: PixSettings;
}

export interface PixSettings {
  expirationTime: number;
  allowMultipleKeys: boolean;
  defaultKeyId?: string;
}

export interface CreateStoreData {
  name: string;
  slug: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}