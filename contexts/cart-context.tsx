'use client';
import { DiscountValidator } from '@/lib/discount/discount-validator';
import { discountService, productService } from '@/lib/firebase/firestore';
import { CartDiscount, Product, VariantOption } from '@/types';
import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getProductPrice, getProductTotalStock } from '@/lib/utils/product-helpers';
import { discountServiceNew, productServiceNew } from '@/lib/firebase/firestore-new';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: {
    variantId: string;
    optionId: string;
    optionName: string;
    price: number;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  discount?: CartDiscount;
}

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number, selectedVariant?: CartItem['selectedVariant']) => Promise<{ success: boolean; message: string }>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<{ success: boolean; message: string }>;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  applyDiscount: (couponCode: string, storeId: string) => Promise<{ success: boolean; message: string }>;
  removeDiscount: () => void;
  getFinalTotal: () => number;
  checkStock: (productId: string, variantId?: string, quantity?: number) => Promise<{ available: boolean; currentStock: number }>;
  setStoreId?: (storeId: string) => void;
}

interface CartProviderProps {
  children: React.ReactNode;
  storeId?: string; // ✅ NOVO: storeId opcional para inicialização
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'APPLY_DISCOUNT'; payload: CartDiscount }
  | { type: 'REMOVE_DISCOUNT' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item =>
        item.product.id === action.payload.product.id &&
        item.selectedVariant?.variantId === action.payload.selectedVariant?.variantId &&
        item.selectedVariant?.optionId === action.payload.selectedVariant?.optionId
      );

      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      return calculateTotals(newItems);
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item =>
        !(item.product.id === action.payload.productId &&
          item.selectedVariant?.variantId === action.payload.variantId)
      );
      return calculateTotals(newItems);
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.product.id === action.payload.productId &&
          item.selectedVariant?.variantId === action.payload.variantId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals(newItems);
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return action.payload;

    case 'APPLY_DISCOUNT': {
      return {
        ...state,
        discount: action.payload,
      };
    }

    case 'REMOVE_DISCOUNT': {
      const { discount, ...stateWithoutDiscount } = state;
      return stateWithoutDiscount;
    }

    default:
      return state;
  }
}

function calculateTotals(items: CartItem[]): CartState {
  const total = items.reduce((sum, item) => {
    // ✅ Usar preço da variação ou helper do produto
    const price = item.selectedVariant?.price || getProductPrice(item.product);
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total, itemCount };
}

const CART_STORAGE_KEY = 'easy-platform-cart';

export function CartProvider({ children, storeId }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(storeId);

  useEffect(() => {
    if (storeId) {
      setCurrentStoreId(storeId);
    }
  }, [storeId]);

  // ✅ NOVO: Função para definir storeId
  const setStoreId = (storeId: string) => {
    setCurrentStoreId(storeId);
  };

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [state]);

  const checkStock: CartContextType['checkStock'] = async (productId: string, variantId?: string, quantity: number = 1): Promise<{ available: boolean; currentStock: number }> => {
    try {
      console.log('🔍 checkStock: Iniciando verificação', {
        productId,
        variantId,
        quantity,
        currentStoreId
      });

      // ✅ CORREÇÃO: Verificar se temos storeId
      if (!currentStoreId) {
        console.log('❌ checkStock: StoreId não disponível no contexto');
        return { available: false, currentStock: 0 };
      }

      // ✅ CORREÇÃO: Usar productServiceNew com storeId correto
      const product = await productServiceNew.getProduct(currentStoreId, productId);

      if (!product) {
        console.log('❌ checkStock: Produto não encontrado');
        return { available: false, currentStock: 0 };
      }

      console.log('📦 checkStock: Produto carregado', {
        name: product.name,
        hasVariants: product.hasVariants,
        variantsCount: product.variants?.length || 0
      });

      // Resto da função permanece EXATAMENTE igual...
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        console.log('🎯 checkStock: Produto tem variações');

        let selectedOption: VariantOption | undefined;

        for (const variant of product.variants) {
          selectedOption = variant.options.find(opt => opt.id === variantId);
          if (selectedOption) break;
        }

        if (selectedOption) {
          const currentStock = selectedOption.stock || 0;
          const cartQuantity = state.items
            .filter(item => item.product.id === productId)
            .find(item => item.selectedVariant?.optionId === variantId)?.quantity || 0;

          const availableStock = Math.max(0, currentStock - cartQuantity);

          console.log('📊 checkStock: Resultado variação', {
            optionName: selectedOption.name,
            currentStock,
            cartQuantity,
            availableStock,
            required: quantity,
            available: availableStock >= quantity
          });

          return {
            available: availableStock >= quantity,
            currentStock: availableStock
          };
        } else {
          console.log('⚠️ checkStock: Variação não encontrada, usando primeira opção');
          const firstOption = product.variants[0]?.options[0];
          if (firstOption) {
            const currentStock = firstOption.stock || 0;
            const cartQuantity = state.items
              .filter(item => item.product.id === productId)
              .find(item => !item.selectedVariant)?.quantity || 0;

            const availableStock = Math.max(0, currentStock - cartQuantity);

            return {
              available: availableStock >= quantity,
              currentStock: availableStock
            };
          }
        }
      }

      // Para produtos SEM variações
      console.log('📦 checkStock: Produto sem variações');
      const currentStock = getProductTotalStock(product);
      const cartQuantity = state.items
        .filter(item => item.product.id === productId)
        .find(item => !item.selectedVariant)?.quantity || 0;

      const availableStock = Math.max(0, currentStock - cartQuantity);

      console.log('📊 checkStock: Resultado sem variações', {
        currentStock,
        cartQuantity,
        availableStock,
        required: quantity,
        available: availableStock >= quantity
      });

      return {
        available: availableStock >= quantity,
        currentStock: availableStock
      };

    } catch (error) {
      console.error('❌ checkStock: Erro ao verificar estoque:', error);
      return { available: false, currentStock: 0 };
    }
  };

  const addItem: CartContextType['addItem'] = async (product, quantity = 1, selectedVariant) => {
    try {
      console.log('🛒 addItem: Iniciando adição', {
        product: product.name,
        productId: product.id,
        quantity,
        selectedVariant,
        hasVariants: product.hasVariants
      });

      // ✅ CORREÇÃO: Usar checkStock corrigido
      const stockCheck = await checkStock(
        product.id,
        selectedVariant?.optionId,
        quantity
      );

      console.log('📊 addItem: Resultado verificação estoque', stockCheck);

      if (!stockCheck.available) {
        const message = stockCheck.currentStock === 0
          ? 'Produto esgotado'
          : `Apenas ${stockCheck.currentStock} unidades disponíveis`;

        console.log('❌ addItem: Estoque insuficiente', { message });
        return {
          success: false,
          message
        };
      }

      // ✅ CORREÇÃO: Dispatch para adicionar item
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          product,
          quantity,
          selectedVariant,
        },
      });

      console.log('✅ addItem: Produto adicionado com sucesso');
      return { success: true, message: 'Produto adicionado ao carrinho' };

    } catch (error) {
      console.error('❌ addItem: Erro inesperado:', error);
      return {
        success: false,
        message: 'Erro ao adicionar produto ao carrinho'
      };
    }
  };

  /** ANTES DO TEMP 
  const addItem: CartContextType['addItem'] = async (product, quantity = 1, selectedVariant) => {
    console.log('🛒 addItem: Iniciando adição', {
      product: product.name,
      quantity,
      selectedVariant,
      hasVariants: product.hasVariants
    });

    const stockCheck = await checkStock(
      product.id,
      selectedVariant?.optionId,
      quantity
    );

    console.log('📊 addItem: Resultado checkStock', stockCheck);

    if (!stockCheck.available) {
      const message = stockCheck.currentStock === 0
        ? 'Produto esgotado'
        : `Apenas ${stockCheck.currentStock} unidades disponíveis`;

      console.log('❌ addItem: Estoque insuficiente', { message });
      return {
        success: false,
        message
      };
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product,
        quantity,
        selectedVariant,
      },
    });

    console.log('✅ addItem: Produto adicionado com sucesso');
    return { success: true, message: 'Produto adicionado ao carrinho' };
  };*/

  const updateQuantity: CartContextType['updateQuantity'] = async (productId, quantity, variantId) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return { success: true, message: 'Item removido' };
    }

    const stockCheck = await checkStock(productId, variantId, quantity);
    if (!stockCheck.available) {
      return {
        success: false,
        message: `Estoque insuficiente. Apenas ${stockCheck.currentStock} unidades disponíveis`
      };
    }

    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity, variantId },
    });

    return { success: true, message: 'Quantidade atualizada' };
  };

  const removeItem: CartContextType['removeItem'] = (productId, variantId) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId, variantId },
    });
  };

  const clearCart: CartContextType['clearCart'] = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = () => state.itemCount;
  const getTotalPrice = () => state.total;

  const applyDiscount: CartContextType['applyDiscount'] = async (couponCode, storeId) => {
    try {
      // ✅ ALTERAÇÃO: Usar discountServiceNew
      const coupon = await discountServiceNew.getCouponByCode(storeId, couponCode);

      if (!coupon) {
        return { success: false, message: 'Cupom não encontrado' };
      }

      const validation = DiscountValidator.validateCoupon(coupon, state.items, state.total);

      if (!validation.isValid) {
        return { success: false, message: validation.error || 'Cupom inválido' };
      }

      const discountAmount = DiscountValidator.calculateDiscount(coupon, state.total);

      const cartDiscount: CartDiscount = {
        couponCode: coupon.code,
        discountAmount,
        discountType: coupon.discountType,
        applied: true,
      };

      dispatch({
        type: 'APPLY_DISCOUNT',
        payload: cartDiscount,
      });

      return {
        success: true,
        message: `Cupom aplicado! Desconto de ${DiscountValidator.formatCouponDescription(coupon)}`
      };

    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      return { success: false, message: 'Erro ao aplicar cupom' };
    }
  };

  const removeDiscount: CartContextType['removeDiscount'] = () => {
    dispatch({ type: 'REMOVE_DISCOUNT' });
  };

  const getFinalTotal: CartContextType['getFinalTotal'] = () => {
    const discountAmount = state.discount?.discountAmount || 0;
    return Math.max(0, state.total - discountAmount);
  };

  const value: CartContextType & { setStoreId?: (storeId: string) => void } = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotalPrice,
    applyDiscount,
    removeDiscount,
    getFinalTotal,
    checkStock,
    setStoreId, // ✅ NOVO: Expor setStoreId no contexto
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};