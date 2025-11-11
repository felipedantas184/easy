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
  shippingSettings: ShippingSettings; // ✅ NOVO
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

export interface ShippingSettings {
  enabled: boolean;
  calculationMethod: 'fixed' | 'regional_table' | 'weight_based' | 'free';
  freeShippingThreshold?: number;
  fixedPrice?: number;
  regionalTable?: ShippingRegion[];
  weightBasedRates?: WeightBasedRate[];
  pickupEnabled: boolean;
  pickupMessage?: string;
}

export interface ShippingRegion {
  id: string;
  name: string;
  states: string[];
  price: number;
  deliveryDays: string;
}

export interface WeightBasedRate {
  id: string;
  minWeight: number; // em kg
  maxWeight: number; // em kg
  price: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryDays: string;
  description?: string;
}