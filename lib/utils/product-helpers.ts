import { Product, ProductVariant, VariantOption } from '@/types/products';

export const getProductPrice = (product: Product): number => {
  if (!product.variants.length || !product.variants[0].options.length) return 0;
  return product.variants[0].options[0].price;
};

export const getProductComparePrice = (product: Product): number | undefined => {
  if (!product.variants.length || !product.variants[0].options.length) return undefined;
  return product.variants[0].options[0].comparePrice;
};

export const getProductTotalStock = (product: Product): number => {
  if (!product.hasVariants) {
    return product.variants[0]?.options[0]?.stock || 0;
  }
  
  return product.variants.reduce((total, variant) => {
    return total + variant.options.reduce((variantTotal, option) => {
      return variantTotal + option.stock;
    }, 0);
  }, 0);
};

export const hasProductDiscount = (product: Product): boolean => {
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
  const variant = product.variants.find(v => v.id === variantId);
  return variant?.options.find(opt => opt.id === optionId);
};

export const getProductTrackInventory = (product: Product): boolean => {
  // Produto controla estoque se pelo menos uma opção tem estoque finito
  return product.variants.some(variant => 
    variant.options.some(option => option.stock < 999999)
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
  return product.variants.some(variant =>
    variant.options.some(option =>
      option.comparePrice && option.comparePrice > option.price
    )
  );
};

// Helper para obter o desconto percentual
export const getDiscountPercentage = (price: number, comparePrice: number): number => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};