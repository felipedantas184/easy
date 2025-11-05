export interface Order {
  id: string;
  storeId: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: Date;
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
}

export type OrderStatus = 
  | 'pending'    // Aguardando confirmação
  | 'confirmed'  // Pedido confirmado
  | 'preparing'  // Em preparação
  | 'shipped'    // Enviado
  | 'delivered'  // Entregue
  | 'cancelled'; // Cancelado

export type PaymentMethod = 'pix' | 'credit_card' | 'bank_slip';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';