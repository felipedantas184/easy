import { ShippingOption } from "./store";
import { DiscountCoupon } from "./discount";

export interface Order {
  id: string;
  storeId: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  
  // ✅ CORREÇÃO: Shipping agora é opcional e address é separado
  shipping?: {
    method: string;
    cost: number;
    option: ShippingOption;
    estimatedDelivery: string;
    address?: { // ✅ TORNAR address OPCIONAL
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  
  // ✅ CORREÇÃO: Discount também opcional
  discount?: {
    couponCode: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed' | 'shipping';
    originalTotal: number;
    finalTotal: number;
    couponDetails?: DiscountCoupon;
  };
  
  // ✅ CORREÇÃO: Breakdown agora é opcional com valores padrão
  breakdown?: {
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    total: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variant?: {
    variantId: string;
    optionId: string;
    optionName: string;
    price: number;
  };
  quantity: number;
  price: number;
  total?: number; // ✅ TORNAR total OPCIONAL para compatibilidade
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'pix' | 'credit_card' | 'bank_slip';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';