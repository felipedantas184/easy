// lib/utils/cart-helpers.ts
import { Product } from '@/types';

// Definir a interface CartItem localmente (mesma estrutura do cart-context)
interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: {
    variantId: string;
    optionId: string;
    optionName: string;
    price: number;
  };
}

/**
 * Serializa o carrinho para salvar no localStorage
 * Converte objetos complexos em estruturas simples
 */
export function serializeCart(cartData: any): string {
  try {
    const serializedData = {
      ...cartData,
      items: cartData.items.map((item: CartItem) => ({
        ...item,
        product: serializeProduct(item.product)
      }))
    };
    
    return JSON.stringify(serializedData);
  } catch (error) {
    console.error('Erro ao serializar carrinho:', error);
    return '{}';
  }
}

/**
 * Desserializa o carrinho do localStorage
 * Reconstrói objetos complexos a partir do JSON
 */
export function deserializeCart(cartJson: string): any {
  try {
    const parsedData = JSON.parse(cartJson);
    
    return {
      ...parsedData,
      items: parsedData.items?.map((item: any) => ({
        ...item,
        product: deserializeProduct(item.product)
      })) || []
    };
  } catch (error) {
    console.error('Erro ao desserializar carrinho:', error);
    return { items: [], total: 0, itemCount: 0 };
  }
}

/**
 * Serializa um produto para salvar no localStorage
 */
function serializeProduct(product: Product): any {
  return {
    ...product,
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
    // Garantir que arrays estejam sempre definidos
    images: product.images || [],
    variants: product.variants || []
  };
}

/**
 * Desserializa um produto do localStorage
 * Reconstrói as datas e garante a estrutura correta
 */
function deserializeProduct(productData: any): Product {
  return {
    ...productData,
    createdAt: productData.createdAt ? new Date(productData.createdAt) : new Date(),
    updatedAt: productData.updatedAt ? new Date(productData.updatedAt) : new Date(),
    // Garantir que arrays estejam sempre definidos
    images: productData.images || [],
    variants: productData.variants || [],
    // Garantir valores padrão para campos obrigatórios
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    hasVariants: productData.hasVariants !== undefined ? productData.hasVariants : false
  };
}

/**
 * Valida se um item do carrinho tem a estrutura correta
 */
export function validateCartItem(item: any): item is CartItem {
  return (
    item &&
    typeof item === 'object' &&
    item.product &&
    typeof item.product.id === 'string' &&
    typeof item.product.name === 'string' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
}

/**
 * Limpa dados corrompidos do localStorage
 */
export function clearCorruptedCart(): void {
  try {
    localStorage.removeItem('easy-platform-cart');
    console.log('🔄 Carrinho corrompido limpo do localStorage');
  } catch (error) {
    console.error('Erro ao limpar carrinho corrompido:', error);
  }
}