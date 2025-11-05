export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number; // Preço original para promoções
  images: string[];
  category: string;
  isActive: boolean;
  hasVariants: boolean;
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string; // Ex: "Tamanho", "Cor"
  options: VariantOption[];
}

export interface VariantOption {
  id: string;
  name: string; // Ex: "P", "M", "G" ou "Azul", "Vermelho"
  price: number;
  comparePrice?: number;
  stock: number;
  sku?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}