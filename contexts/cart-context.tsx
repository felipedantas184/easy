'use client';
import { DiscountValidator } from '@/lib/discount/discount-validator';
import { CartDiscount, Order, Product, ShippingOption, VariantOption } from '@/types';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { getProductPrice, getProductTotalStock } from '@/lib/utils/product-helpers';
import { discountServiceNew, productServiceNew, storeServiceNew } from '@/lib/firebase/firestore-new';
import { orderServiceNew } from '@/lib/firebase/order-service-new';
import {
  serializeCart,
  deserializeCart,
  validateCartItem,
  clearCorruptedCart
} from '@/lib/utils/cart-helpers';
import { shippingService } from '@/lib/firebase/shipping-service';

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
  storeId?: string;
  // ✅ NOVO: Estado do frete
  shipping?: {
    selectedOption?: ShippingOption;
    options: ShippingOption[];
    destinationState?: string;
    totalWeight: number;
  };
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
  setStoreId: (storeId: string) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Promise<{ success: boolean; orderId?: string; message: string }>;
  calculateShipping: (destinationState: string) => Promise<ShippingOption[]>;
  selectShipping: (shippingOption: ShippingOption) => void;
  getShippingOptions: () => ShippingOption[];
  getSelectedShipping: () => ShippingOption | undefined;
  getTotalWithShipping: () => number;
}

interface CartProviderProps {
  children: React.ReactNode;
  storeId?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variantId?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'APPLY_DISCOUNT'; payload: CartDiscount }
  | { type: 'REMOVE_DISCOUNT' }
  | { type: 'SET_STORE_ID'; payload: string }
  | { type: 'SET_SHIPPING_OPTIONS'; payload: ShippingOption[] }
  | { type: 'SELECT_SHIPPING'; payload: ShippingOption }
  | { type: 'SET_DESTINATION_STATE'; payload: string };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item =>
        item.product.id === action.payload.product.id &&
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

      return calculateTotals({ ...state, items: newItems });
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item =>
        !(item.product.id === action.payload.productId &&
          item.selectedVariant?.optionId === action.payload.variantId)
      );
      return calculateTotals({ ...state, items: newItems });
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.product.id === action.payload.productId &&
          item.selectedVariant?.optionId === action.payload.variantId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      return calculateTotals({ ...state, items: newItems });
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0, storeId: state.storeId };

    case 'LOAD_CART':
      return action.payload;

    case 'SET_SHIPPING_OPTIONS':
      return {
        ...state,
        shipping: {
          // ✅ CORREÇÃO: Garantir que options sempre seja array
          options: action.payload,
          totalWeight: state.shipping?.totalWeight || calculateTotalWeight(state.items),
          // ✅ CORREÇÃO: Manter outros valores existentes
          selectedOption: state.shipping?.selectedOption,
          destinationState: state.shipping?.destinationState
        }
      };

    case 'SELECT_SHIPPING':
      return {
        ...state,
        shipping: {
          // ✅ CORREÇÃO: Garantir que options sempre exista
          options: state.shipping?.options || [],
          totalWeight: state.shipping?.totalWeight || calculateTotalWeight(state.items),
          selectedOption: action.payload,
          destinationState: state.shipping?.destinationState
        }
      };

    case 'SET_DESTINATION_STATE':
      return {
        ...state,
        shipping: {
          // ✅ CORREÇÃO: Garantir estrutura completa
          options: state.shipping?.options || [],
          totalWeight: state.shipping?.totalWeight || calculateTotalWeight(state.items),
          selectedOption: state.shipping?.selectedOption,
          destinationState: action.payload
        }
      };

    case 'APPLY_DISCOUNT':
      return {
        ...state,
        discount: action.payload,
      };

    case 'REMOVE_DISCOUNT': {
      const { discount, ...stateWithoutDiscount } = state;
      return stateWithoutDiscount;
    }

    case 'SET_STORE_ID':
      return {
        ...state,
        storeId: action.payload
      };

    default:
      return state;
  }
}

function calculateTotals(state: CartState): CartState {
  const total = state.items.reduce((sum, item) => {
    const price = item.selectedVariant?.price || getProductPrice(item.product);
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return { ...state, total, itemCount };
}

function calculateTotalWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const itemWeight = item.product.weight || 0;
    return total + (itemWeight * item.quantity);
  }, 0);
}

const CART_STORAGE_KEY = 'easy-platform-cart';

export function CartProvider({ children, storeId }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
    storeId,
    // ✅ ADICIONAR: Estado inicial completo para shipping
    shipping: {
      options: [],
      totalWeight: 0
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ CARREGAR CARRINHO DO LOCALSTORAGE (CORRIGIDO)
  useEffect(() => {
    try {
      console.log('🔄 CartProvider: Iniciando carregamento do carrinho...');

      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        console.log('📦 CartProvider: Carrinho encontrado no localStorage');

        const cartData = deserializeCart(savedCart);

        // Validar estrutura do carrinho
        if (cartData.items && Array.isArray(cartData.items)) {
          const validItems = cartData.items.filter(validateCartItem);

          if (validItems.length > 0) {
            console.log(`✅ CartProvider: ${validItems.length} itens válidos carregados`);

            dispatch({
              type: 'LOAD_CART',
              payload: {
                ...cartData,
                items: validItems
              }
            });
          } else {
            console.log('⚠️ CartProvider: Nenhum item válido encontrado, carrinho vazio');
            clearCorruptedCart();
          }
        } else {
          console.log('❌ CartProvider: Estrutura do carrinho inválida, limpando...');
          clearCorruptedCart();
        }
      } else {
        console.log('🆕 CartProvider: Nenhum carrinho salvo encontrado');
      }
    } catch (error) {
      console.error('❌ CartProvider: Erro crítico ao carregar carrinho:', error);
      clearCorruptedCart();
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // ✅ SALVAR CARRINHO NO LOCALSTORAGE (CORRIGIDO)
  useEffect(() => {
    // Só salva após a inicialização para evitar loop
    if (!isInitialized) return;

    try {
      console.log('💾 CartProvider: Salvando carrinho no localStorage...', {
        items: state.items.length,
        total: state.total
      });

      const serializedData = serializeCart(state);
      localStorage.setItem(CART_STORAGE_KEY, serializedData);

      console.log('✅ CartProvider: Carrinho salvo com sucesso');
    } catch (error) {
      console.error('❌ CartProvider: Erro ao salvar carrinho:', error);
    }
  }, [state, isInitialized]);

  // ✅ VERIFICAÇÃO DE ESTOQUE OTIMIZADA
  const checkStock = useCallback(async (
    productId: string,
    variantId?: string,
    quantity: number = 1
  ): Promise<{ available: boolean; currentStock: number }> => {
    try {
      if (!state.storeId) {
        return { available: false, currentStock: 0 };
      }

      const product = await productServiceNew.getProduct(state.storeId, productId);
      if (!product) {
        return { available: false, currentStock: 0 };
      }

      // Para produtos com variantes
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        let selectedOption: VariantOption | undefined;

        // Encontrar a opção selecionada
        for (const variant of product.variants) {
          selectedOption = variant.options.find(opt => opt.id === variantId);
          if (selectedOption) break;
        }

        // Se não encontrou a variante específica, usar a primeira opção
        if (!selectedOption && product.variants[0]?.options[0]) {
          selectedOption = product.variants[0].options[0];
        }

        if (selectedOption) {
          const currentStock = selectedOption.stock || 0;
          const cartQuantity = state.items
            .filter(item => item.product.id === productId)
            .find(item => item.selectedVariant?.optionId === (variantId || selectedOption?.id))?.quantity || 0;

          const availableStock = Math.max(0, currentStock - cartQuantity);
          return {
            available: availableStock >= quantity,
            currentStock: availableStock
          };
        }
      }

      // Para produtos sem variantes
      const currentStock = getProductTotalStock(product);
      const cartQuantity = state.items
        .filter(item => item.product.id === productId)
        .find(item => !item.selectedVariant)?.quantity || 0;

      const availableStock = Math.max(0, currentStock - cartQuantity);

      return {
        available: availableStock >= quantity,
        currentStock: availableStock
      };

    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      return { available: false, currentStock: 0 };
    }
  }, [state.storeId, state.items]);

  // ✅ ADICIONAR ITEM COM VALIDAÇÃO
  const addItem = useCallback(async (
    product: Product,
    quantity: number = 1,
    selectedVariant?: CartItem['selectedVariant']
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const stockCheck = await checkStock(
        product.id,
        selectedVariant?.optionId,
        quantity
      );

      if (!stockCheck.available) {
        const message = stockCheck.currentStock === 0
          ? 'Produto esgotado'
          : `Apenas ${stockCheck.currentStock} unidades disponíveis`;

        return { success: false, message };
      }

      dispatch({
        type: 'ADD_ITEM',
        payload: { product, quantity, selectedVariant },
      });

      return { success: true, message: 'Produto adicionado ao carrinho' };
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return { success: false, message: 'Erro ao adicionar produto ao carrinho' };
    }
  }, [checkStock]);

  // ✅ ATUALIZAR QUANTIDADE
  const updateQuantity = useCallback(async (
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<{ success: boolean; message: string }> => {
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
  }, [checkStock]);

  // ✅ CRIAR PEDIDO
  const createOrder = useCallback(async (
    orderData: Omit<Order, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; orderId?: string; message: string }> => {
    try {
      if (!state.storeId) {
        return { success: false, message: 'Store ID não definido' };
      }

      // Validar estoque uma última vez antes de criar o pedido
      for (const item of orderData.items) {
        const stockCheck = await checkStock(
          item.productId,
          item.variant?.optionId,
          item.quantity
        );

        if (!stockCheck.available) {
          return {
            success: false,
            message: `Estoque insuficiente para ${item.productName}`
          };
        }
      }

      const orderId = await orderServiceNew.createOrder(state.storeId, orderData);
      return { success: true, orderId, message: 'Pedido criado com sucesso' };
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return { success: false, message: 'Erro ao criar pedido' };
    }
  }, [state.storeId, checkStock]);

  // ✅ OUTRAS FUNÇÕES
  const removeItem = useCallback((productId: string, variantId?: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId, variantId },
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const setStoreId = useCallback((storeId: string) => {
    dispatch({ type: 'SET_STORE_ID', payload: storeId });
  }, []);

  const applyDiscount = useCallback(async (couponCode: string, storeId: string) => {
    try {
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

      dispatch({ type: 'APPLY_DISCOUNT', payload: cartDiscount });
      return {
        success: true,
        message: `Cupom aplicado! Desconto de ${DiscountValidator.formatCouponDescription(coupon)}`
      };
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      return { success: false, message: 'Erro ao aplicar cupom' };
    }
  }, [state.items, state.total]);

  const removeDiscount = useCallback(() => {
    dispatch({ type: 'REMOVE_DISCOUNT' });
  }, []);

  const calculateShipping = useCallback(async (destinationState: string): Promise<ShippingOption[]> => {
    try {
      if (!state.storeId) {
        console.error('Store ID não definido para cálculo de frete');
        return [];
      }

      // Buscar configurações de frete da loja
      const store = await storeServiceNew.getStore(state.storeId);
      if (!store) {
        console.error('Loja não encontrada para cálculo de frete');
        return [];
      }

      const shippingSettings = store.settings.shippingSettings;

      // Calcular peso total do carrinho
      const totalWeight = calculateTotalWeight(state.items);

      // Calcular opções de frete
      const options = await shippingService.calculateShipping(
        shippingSettings,
        state.total,
        destinationState,
        totalWeight
      );

      dispatch({ type: 'SET_SHIPPING_OPTIONS', payload: options });
      dispatch({ type: 'SET_DESTINATION_STATE', payload: destinationState });

      return options;
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      return [];
    }
  }, [state.storeId, state.items, state.total]);

  const selectShipping = useCallback((shippingOption: ShippingOption) => {
    dispatch({ type: 'SELECT_SHIPPING', payload: shippingOption });
  }, []);

  const getShippingOptions = useCallback(() => {
    return state.shipping?.options || [];
  }, [state.shipping?.options]);

  const getSelectedShipping = useCallback(() => {
    return state.shipping?.selectedOption;
  }, [state.shipping?.selectedOption]);



  const getItemCount = useCallback(() => state.itemCount, [state.itemCount]);
  const getTotalPrice = useCallback(() => state.total, [state.total]);
  const getFinalTotal = useCallback(() => {
    const discountAmount = state.discount?.discountAmount || 0;
    return Math.max(0, state.total - discountAmount);
  }, [state.total, state.discount]);

  const getTotalWithShipping = useCallback(() => {
    const baseTotal = getFinalTotal();
    const shippingCost = state.shipping?.selectedOption?.price || 0;
    return baseTotal + shippingCost;
  }, [getFinalTotal, state.shipping?.selectedOption]);

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
    setStoreId,
    createOrder,
    calculateShipping,
    selectShipping,
    getShippingOptions,
    getSelectedShipping,
    getTotalWithShipping,
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