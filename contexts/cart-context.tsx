'use client';
import { Product } from '@/types';
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
}

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number, selectedVariant?: CartItem['selectedVariant']) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

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

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getTotalPrice,
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