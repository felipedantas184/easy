import { ProductImage } from "./products";

// types/product-subcollections.ts
export interface ProductVariantSubcollection {
  id: string;
  productId: string;
  storeId: string;
  
  // ✅ NOVO: Informações do grupo
  variantGroup: string;        // Ex: "Armazenamento", "Cor"
  variantGroupId: string;      // Ex: "storage", "color"
  
  // ✅ MUDAR: name agora é o valor da opção
  optionName: string;          // Ex: "128Gb", "Preto" 
  optionValue: string;         // Ex: "128gb", "black"
  
  price: number;
  comparePrice?: number;
  stock: number;
  sku: string;
  barcode?: string;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extensão do Product para nova estrutura
export interface ProductWithSubcollections {
  id: string;
  storeId: string;
  name: string;
  description: string;
  images: ProductImage[];
  category: string;
  isActive: boolean;
  hasVariants: boolean;
  // REMOVIDO: variants array - agora está em collection separada
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