// lib/utils/product-helpers.ts - CORREÇÃO COMPLETA
import { Product, ProductVariant, VariantOption } from '@/types/products';

export const getProductPrice = (product: Product): number => {
  if (!product.variants || product.variants.length === 0) return 0;
  
  // Se tem variações, retorna o menor preço entre todas as opções ativas
  if (product.hasVariants) {
    let minPrice = Infinity;
    
    product.variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.isActive && (option.stock || 0) > 0) {
          minPrice = Math.min(minPrice, option.price);
        }
      });
    });
    
    return minPrice !== Infinity ? minPrice : 0;
  }
  
  // Se não tem variações, pega da primeira opção
  return product.variants[0]?.options[0]?.price || 0;
};

export const getProductComparePrice = (product: Product): number | undefined => {
  if (!product.variants || product.variants.length === 0) return undefined;
  
  // Se tem variações, retorna o menor comparePrice entre opções com desconto
  if (product.hasVariants) {
    let minComparePrice: number | undefined = undefined;
    
    product.variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.isActive && option.comparePrice && option.comparePrice > option.price) {
          if (!minComparePrice || option.comparePrice < minComparePrice) {
            minComparePrice = option.comparePrice;
          }
        }
      });
    });
    
    return minComparePrice;
  }
  
  // Se não tem variações, pega da primeira opção
  return product.variants[0]?.options[0]?.comparePrice;
};

export const getProductTotalStock = (product: Product): number => {
  if (!product.variants || product.variants.length === 0) return 0;
  
  if (product.hasVariants) {
    // Para produtos com variações, soma o estoque de TODAS as opções
    return product.variants.reduce((total, variant) => {
      return total + variant.options.reduce((variantTotal, option) => {
        return variantTotal + (option.stock || 0);
      }, 0);
    }, 0);
  }
  
  // Para produtos sem variações, pega o estoque da primeira opção
  return product.variants[0]?.options[0]?.stock || 0;
};

export const hasProductDiscount = (product: Product): boolean => {
  if (!product.variants) return false;
  
  if (product.hasVariants) {
    // Verifica se alguma opção de alguma variante tem comparePrice > price
    return product.variants.some(variant =>
      variant.options.some(option =>
        option.comparePrice && option.comparePrice > option.price
      )
    );
  }
  
  // Para produtos sem variações
  const comparePrice = getProductComparePrice(product);
  const price = getProductPrice(product);
  return !!comparePrice && comparePrice > price;
};

export const createDefaultVariant = (): ProductVariant => ({
  id: 'default',
  name: 'Padrão',
  options: [{
    id: 'default-option',
    name: 'Único',
    price: 0,
    comparePrice: undefined,
    stock: 0,
    sku: '',
    isActive: true
  }]
});

export const findVariantOption = (
  product: Product, 
  variantId: string, 
  optionId: string
): VariantOption | undefined => {
  const variant = product.variants?.find(v => v.id === variantId);
  return variant?.options.find(opt => opt.id === optionId);
};

export const getProductTrackInventory = (product: Product): boolean => {
  if (!product.variants) return false;
  
  // Produto controla estoque se pelo menos uma opção tem estoque finito
  return product.variants.some(variant => 
    variant.options.some(option => (option.stock || 0) < 999999)
  );
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

export const parsePriceInput = (value: string): number => {
  // Remove R$, pontos, espaços e mantém números e vírgula
  const cleanValue = value
    .replace(/[^\d,]/g, '')
    .replace(',', '.');
  
  const numberValue = parseFloat(cleanValue);
  return isNaN(numberValue) ? 0 : numberValue;
};

export const formatPriceInput = (value: string): string => {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Converte para número e formata
  const numberValue = parseInt(numbers, 10) / 100;
  return formatPrice(numberValue);
};

// Helper para verificar se há promoção ativa em alguma opção
export const hasActivePromotion = (product: Product): boolean => {
  if (!product.variants) return false;
  
  return product.variants.some(variant =>
    variant.options.some(option =>
      option.comparePrice && option.comparePrice > option.price
    )
  );
};

// Helper para obter o desconto percentual
export const getDiscountPercentage = (price: number, comparePrice?: number): number => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};

export function getPriceRange(product: Product): { min: number; max: number } {
  if (!product.hasVariants || !product.variants || product.variants.length === 0) {
    const price = getProductPrice(product);
    return { min: price, max: price };
  }

  let minPrice = Infinity;
  let maxPrice = 0;

  product.variants.forEach(variant => {
    variant.options.forEach(option => {
      if (option.isActive && (option.stock || 0) > 0) {
        minPrice = Math.min(minPrice, option.price);
        maxPrice = Math.max(maxPrice, option.price);
        
        // Se tem comparePrice, considera também para o range máximo
        if (option.comparePrice && option.comparePrice > option.price) {
          maxPrice = Math.max(maxPrice, option.comparePrice);
        }
      }
    });
  });

  if (minPrice === Infinity) {
    const basePrice = getProductPrice(product);
    return { min: basePrice, max: basePrice };
  }

  return { min: minPrice, max: maxPrice };
}

// ✅ FUNÇÃO: Verificar se produto tem promoção em alguma variação
export function hasAnyPromotion(product: Product): boolean {
  if (!product.variants) return false;
  
  if (!product.hasVariants || product.variants.length === 0) {
    const comparePrice = getProductComparePrice(product);
    const price = getProductPrice(product);
    return !!comparePrice && comparePrice > price;
  }

  return product.variants.some(variant =>
    variant.options.some(option =>
      option.comparePrice && option.comparePrice > option.price
    )
  );
}

// ✅ FUNÇÃO: Obter maior desconto entre variações
export const getMaxDiscountPercentage = (product: Product): number => {
  if (!product.variants) return 0;
  
  let maxDiscount = 0;
  
  if (product.hasVariants) {
    product.variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.comparePrice && option.comparePrice > option.price) {
          const discount = getDiscountPercentage(option.price, option.comparePrice);
          maxDiscount = Math.max(maxDiscount, discount);
        }
      });
    });
  } else {
    // Para produtos sem variações
    const price = getProductPrice(product);
    const comparePrice = getProductComparePrice(product);
    if (comparePrice && comparePrice > price) {
      maxDiscount = getDiscountPercentage(price, comparePrice);
    }
  }
  
  return maxDiscount;
};

// ✅ NOVA FUNÇÃO: Verificar se produto tem imagens
export const hasProductImages = (product: Product): boolean => {
  return !!product.images && product.images.length > 0;
};

// ✅ NOVA FUNÇÃO: Obter imagem principal
export const getMainImage = (product: Product): string => {
  if (!product.images || product.images.length === 0) {
    return '/images/placeholder-product.jpg';
  }
  
  const primaryImage = product.images.find(img => img.isPrimary);
  return primaryImage?.url || product.images[0].url;
};