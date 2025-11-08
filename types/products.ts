export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  images: ProductImage[];
  category: string;
  isActive: boolean;
  hasVariants: boolean;
  variants: ProductVariant[];
  
  // REMOVIDOS: basePrice, comparePrice, totalStock, trackInventory, lowStockAlert
  // Preço e estoque agora ficam NAS VARIAÇÕES
  
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  seo?: {
    title: string;
    description: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: VariantOption[];
}

export interface VariantOption {
  id: string;
  name: string;
  price: number; // ✅ FONTE ÚNICA do preço
  comparePrice?: number;
  stock: number; // ✅ FONTE ÚNICA do estoque
  sku: string; // ✅ Agora obrigatório
  barcode?: string;
  weight?: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}