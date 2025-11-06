'use client';
import { DiscountValidator } from '@/lib/discount/discount-validator';
import { discountService } from '@/lib/firebase/firestore';
import { CartDiscount, Product } from '@/types';
import { createContext, useContext, useReducer, useEffect } from 'react';

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
  addItem: (product: Product, quantity?: number, selectedVariant?: CartItem['selectedVariant']) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  applyDiscount: (couponCode: string, storeId: string) => Promise<{ success: boolean; message: string }>;
  removeDiscount: () => void;
  getFinalTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'APPLY_DISCOUNT'; payload: CartDiscount } // ✅ NOVO
  | { type: 'REMOVE_DISCOUNT' }; // ✅ NOVO

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
        // Item já existe, atualizar quantidade
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      } else {
        // Novo item
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
      ).filter(item => item.quantity > 0); // Remove se quantidade for 0

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
    const price = item.selectedVariant?.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, total, itemCount };
}

// Persistência no localStorage
const CART_STORAGE_KEY = 'easy-platform-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });

  // Carregar carrinho do localStorage
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

  // Salvar carrinho no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [state]);

  const addItem: CartContextType['addItem'] = (product, quantity = 1, selectedVariant) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product,
        quantity,
        selectedVariant,
      },
    });
  };

  const removeItem: CartContextType['removeItem'] = (productId, variantId) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId, variantId },
    });
  };

  const updateQuantity: CartContextType['updateQuantity'] = (productId, quantity, variantId) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity, variantId },
    });
  };

  const clearCart: CartContextType['clearCart'] = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = () => state.itemCount;
  const getTotalPrice = () => state.total;

  const applyDiscount: CartContextType['applyDiscount'] = async (couponCode, storeId) => {
    console.log('🟦 applyDiscount() chamado');
    console.log('➡️ Código do cupom:', couponCode);
    console.log('➡️ Store ID recebido:', storeId);

    try {
      const coupon = await discountService.getCouponByCode(storeId, couponCode);
      console.log('📦 Resultado da busca de cupom:', coupon);

      if (!coupon) {
        console.warn('⚠️ Cupom não encontrado no banco de dados.');
        return { success: false, message: 'Cupom não encontrado' };
      }

      const validation = DiscountValidator.validateCoupon(coupon, state.items, state.total);
      console.log('🧮 Resultado da validação:', validation);

      if (!validation.isValid) {
        console.warn('⚠️ Cupom inválido:', validation.error);
        return { success: false, message: validation.error || 'Cupom inválido' };
      }

      const discountAmount = DiscountValidator.calculateDiscount(coupon, state.total);
      console.log('💰 Valor calculado do desconto:', discountAmount);

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

      console.log('✅ Cupom aplicado com sucesso!');

      return {
        success: true,
        message: `Cupom aplicado! Desconto de ${DiscountValidator.formatCouponDescription(coupon)}`
      };

    } catch (error) {
      console.error('🔥 Erro ao aplicar cupom:', error);
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

  const value: CartContextType = {
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