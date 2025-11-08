'use client';
import { DiscountValidator } from '@/lib/discount/discount-validator';
import { discountService, productService } from '@/lib/firebase/firestore';
import { CartDiscount, Product } from '@/types';
import { createContext, useContext, useReducer, useEffect } from 'react';
import { getProductPrice, getProductTotalStock } from '@/lib/utils/product-helpers';

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });

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

  const checkStock = async (productId: string, variantId?: string, quantity: number = 1): Promise<{ available: boolean; currentStock: number }> => {
    try {
      const product = await productService.getProduct(productId);
      if (!product) {
        return { available: false, currentStock: 0 };
      }

      if (variantId && product.hasVariants) {
        for (const variant of product.variants) {
          const option = variant.options.find(opt => opt.id === variantId);
          if (option) {
            const currentStock = option.stock;
            const cartQuantity = state.items.find(item => 
              item.product.id === productId && 
              item.selectedVariant?.optionId === variantId
            )?.quantity || 0;
            
            const availableStock = currentStock - cartQuantity;
            return { 
              available: availableStock >= quantity, 
              currentStock: availableStock 
            };
          }
        }
      } else {
        const currentStock = getProductTotalStock(product);
        const cartQuantity = state.items.find(item => 
          item.product.id === productId && 
          !item.selectedVariant
        )?.quantity || 0;
        
        const availableStock = currentStock - cartQuantity;
        return { 
          available: availableStock >= quantity, 
          currentStock: availableStock 
        };
      }

      return { available: false, currentStock: 0 };
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      return { available: false, currentStock: 0 };
    }
  };

  const addItem: CartContextType['addItem'] = async (product, quantity = 1, selectedVariant) => {
    const stockCheck = await checkStock(
      product.id, 
      selectedVariant?.optionId, 
      quantity
    );

    if (!stockCheck.available) {
      return { 
        success: false, 
        message: stockCheck.currentStock === 0 
          ? 'Produto esgotado' 
          : `Apenas ${stockCheck.currentStock} unidades disponíveis` 
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

    return { success: true, message: 'Produto adicionado ao carrinho' };
  };

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
      const coupon = await discountService.getCouponByCode(storeId, couponCode);
      
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
    checkStock,
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