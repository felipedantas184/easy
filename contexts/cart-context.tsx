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

const getCurrentPriceForItem = (item: CartItem): number => {
  if (item.selectedVariant) {
    const variant = item.product.variants?.find(v => v.id === item.selectedVariant?.variantId);
    const option = variant?.options.find(opt => opt.id === item.selectedVariant?.optionId);

    // ✅ CORREÇÃO: Priorizar comparePrice se disponível e menor
    if (option?.comparePrice && option.comparePrice < option.price) {
      return option.comparePrice;
    }
    return option?.price || 0;
  } else {
    // Produto sem variações
    const firstVariant = item.product.variants?.[0];
    const firstOption = firstVariant?.options?.[0];

    if (firstOption?.comparePrice && firstOption.comparePrice < firstOption.price) {
      return firstOption.comparePrice;
    }
    return firstOption?.price || 0;
  }
};


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
  shipping?: {
    selectedOption?: ShippingOption;
    options: ShippingOption[];
    destinationState?: string;
    totalWeight: number;
  };
}

interface CreateOrderParams {
  storeId: string;
  customerInfo: any;
  items: any[];
  shipping?: any;
  discount?: any;
  breakdown: {
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    total: number;
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
  calculateShipping: (destinationState: string) => Promise<ShippingOption[]>;
  selectShipping: (shippingOption: ShippingOption) => void;
  getShippingOptions: () => ShippingOption[];
  getSelectedShipping: () => ShippingOption | undefined;
  getTotalWithShipping: () => number;
  getCartBreakdown: () => {
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
  };
  validateOrderData: (customerInfo: any, store: any) => { // ✅ CORREÇÃO: Adicionar store como parâmetro
    isValid: boolean;
    errors: string[];
  };
  createOrder: (orderData: CreateOrderParams) => Promise<{ // ✅ CORREÇÃO: Usar CreateOrderParams
    success: boolean;
    orderId?: string;
    message?: string;
  }>;
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
      // ✅ CORREÇÃO: Usar optionId em vez de variantId para encontrar o item
      const newItems = state.items.map(item => {
        // Comparar productId E optionId (que é único por variante)
        if (item.product.id === action.payload.productId &&
          item.selectedVariant?.optionId === action.payload.variantId) {
          return { ...item, quantity: action.payload.quantity };
        }
        // ✅ CORREÇÃO: Também tratar produtos sem variantes
        if (item.product.id === action.payload.productId &&
          !item.selectedVariant && !action.payload.variantId) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

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
          options: action.payload,
          totalWeight: state.shipping?.totalWeight || calculateTotalWeight(state.items),
          selectedOption: state.shipping?.selectedOption,
          destinationState: state.shipping?.destinationState
        }
      };

    case 'SELECT_SHIPPING':
      return {
        ...state,
        shipping: {
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
    const price = getCurrentPriceForItem(item); // ✅ USA PREÇO PROMOCIONAL
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
    shipping: {
      options: [],
      totalWeight: 0
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ CARREGAR CARRINHO DO LOCALSTORAGE
  useEffect(() => {
    try {
      console.log('🔄 CartProvider: Iniciando carregamento do carrinho...');

      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        console.log('📦 CartProvider: Carrinho encontrado no localStorage');

        const cartData = deserializeCart(savedCart);

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

  // ✅ SALVAR CARRINHO NO LOCALSTORAGE
  useEffect(() => {
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

  // ✅ VERIFICAÇÃO DE ESTOQUE
  const checkStock = useCallback(async (
    productId: string,
    variantId?: string,
    quantity: number = 1,
    isUpdate: boolean = false // ✅ NOVO: Flag para indicar se é atualização
  ): Promise<{ available: boolean; currentStock: number }> => {
    try {
      if (!state.storeId) {
        return { available: false, currentStock: 0 };
      }

      const product = await productServiceNew.getProduct(state.storeId, productId);
      if (!product) {
        return { available: false, currentStock: 0 };
      }

      if (product.hasVariants && product.variants && product.variants.length > 0) {
        let selectedOption: VariantOption | undefined;

        for (const variant of product.variants) {
          selectedOption = variant.options.find(opt => opt.id === variantId);
          if (selectedOption) break;
        }

        if (!selectedOption && product.variants[0]?.options[0]) {
          selectedOption = product.variants[0].options[0];
        }

        if (selectedOption) {
          const currentStock = selectedOption.stock || 0;

          // ✅ CORREÇÃO: Lógica diferente para adição vs atualização
          let cartQuantity = 0;

          if (isUpdate) {
            // Para atualização: não subtrair do estoque (estamos substituindo a quantidade)
            cartQuantity = 0;
          } else {
            // Para adição: subtrair o que já está no carrinho
            cartQuantity = state.items
              .filter(item => item.product.id === productId)
              .find(item => item.selectedVariant?.optionId === (variantId || selectedOption?.id))?.quantity || 0;
          }

          const availableStock = Math.max(0, currentStock - cartQuantity);

          console.log('📊 Verificação de estoque:', {
            productId,
            variantId,
            currentStock,
            cartQuantity,
            availableStock,
            requestedQuantity: quantity,
            isUpdate
          });

          return {
            available: availableStock >= quantity,
            currentStock: availableStock
          };
        }
      }

      // ✅ CORREÇÃO: Mesma lógica para produtos sem variantes
      const currentStock = getProductTotalStock(product);

      let cartQuantity = 0;
      if (isUpdate) {
        cartQuantity = 0;
      } else {
        cartQuantity = state.items
          .filter(item => item.product.id === productId)
          .find(item => !item.selectedVariant)?.quantity || 0;
      }

      const availableStock = Math.max(0, currentStock - cartQuantity);

      console.log('📊 Verificação de estoque (sem variantes):', {
        productId,
        currentStock,
        cartQuantity,
        availableStock,
        requestedQuantity: quantity,
        isUpdate
      });

      return {
        available: availableStock >= quantity,
        currentStock: availableStock
      };

    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      return { available: false, currentStock: 0 };
    }
  }, [state.storeId, state.items]);

  // ✅ ADICIONAR ITEM
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

    const stockCheck = await checkStock(productId, variantId, quantity, true);
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

  // ✅ CORREÇÃO: CRIAR PEDIDO COM PARÂMETRO ÚNICO
  const createOrder = useCallback(async (
    orderData: CreateOrderParams // ✅ CORREÇÃO: Usar CreateOrderParams
  ): Promise<{ success: boolean; orderId?: string; message?: string }> => {
    try {
      // ✅ CORREÇÃO: Chamar orderServiceNew.createOrder com apenas 1 parâmetro
      const result = await orderServiceNew.createOrder(orderData);

      return {
        success: result.success,
        orderId: result.orderId,
        message: result.error
      };
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return { success: false, message: 'Erro ao criar pedido' };
    }
  }, []);

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

      const store = await storeServiceNew.getStore(state.storeId);
      if (!store) {
        console.error('Loja não encontrada para cálculo de frete');
        return [];
      }

      const shippingSettings = store.settings.shippingSettings;
      const totalWeight = calculateTotalWeight(state.items);

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

  const getCartBreakdown = () => {
    const subtotal = state.items.reduce((sum, item) => {
      const itemPrice = getCurrentPriceForItem(item); // ✅ USA PREÇO PROMOCIONAL
      return sum + (itemPrice * item.quantity);
    }, 0);

    const discountAmount = state.discount?.discountAmount || 0;
    const shippingCost = getSelectedShipping()?.price || 0;

    const total = Math.max(0, subtotal - discountAmount + shippingCost);

    return {
      subtotal,
      discountAmount,
      shippingCost,
      total
    };
  };

  // ✅ CORREÇÃO: Função de validação com store como parâmetro
  const validateOrderData = (customerInfo: any, store: any) => {
    const errors: string[] = [];

    if (state.items.length === 0) {
      errors.push('O carrinho está vazio');
    }

    if (!customerInfo.name?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!customerInfo.email?.trim()) {
      errors.push('Email é obrigatório');
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.push('Email inválido');
    }

    if (!customerInfo.phone?.trim()) {
      errors.push('Telefone é obrigatório');
    }

    // ✅ CORREÇÃO: Usar store do parâmetro, não variável externa
    if (store?.settings?.shippingSettings?.enabled && !getSelectedShipping()) {
      errors.push('Selecione uma opção de frete');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

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
    getCartBreakdown,
    validateOrderData
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