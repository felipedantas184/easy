import { Timestamp } from "firebase/firestore";

export interface Store {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  description?: string;
  document?: string; // ✅ NOVO: CNPJ da loja
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
  logo?: string; // ✅ Já existe para upload da logo
}

export interface StoreContact {
  email: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: StoreAddress; // ✅ ATUALIZADO: Agora é um objeto de endereço
  pixKeys?: PixKey[];
}

// ✅ NOVO: Interface para endereço completo
export interface StoreAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface PixKey {
  id: string;
  key: string;
  type: 'email' | 'phone' | 'cpf' | 'cnpj' | 'random';
  isActive: boolean;
  description?: string;
  createdAt: Timestamp | Date;
}

export interface StoreSettings {
  allowPickup: boolean;
  requireCustomerAuth: boolean;
  orderConfirmationMessage?: string;
  maintenanceMode: boolean;
  pixSettings: PixSettings;
  shippingSettings: ShippingSettings;
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
  document?: string; // ✅ NOVO: CNPJ
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string; // ✅ NOVO: URL da logo
  contact?: Partial<StoreContact>; // ✅ ATUALIZADO: Incluir contato inicial
}

// ... (as outras interfaces permanecem iguais)
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
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  deliveryDays: string;
  description?: string;
}