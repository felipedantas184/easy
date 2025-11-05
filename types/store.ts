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
  pixKey?: string;
}

export interface StoreSettings {
  allowPickup: boolean;
  requireCustomerAuth: boolean;
  orderConfirmationMessage?: string;
  maintenanceMode: boolean;
}

export interface CreateStoreData {
  name: string;
  slug: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}