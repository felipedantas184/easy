import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { Order, OrderStatus, PaymentStatus, OrderItem, CustomerInfo } from '@/types/order';
import { inventoryServiceNew } from '../inventory/inventory-service-new';
import { ShippingOption } from '@/types';

interface CreateOrderData {
  storeId: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  shipping?: {
    method: string;
    cost: number;
    option: ShippingOption;
    estimatedDelivery: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  discount?: {
    couponCode: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed' | 'shipping';
    originalTotal: number;
    finalTotal: number;
  };
  breakdown: {
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    total: number;
  };
}

export const orderServiceNew = {
  // Criar pedido na subcollection
  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const { storeId, ...orderDataWithoutStoreId } = orderData;
      
      // ✅ CORREÇÃO: Criar objeto Order completo
      const order: Omit<Order, 'id'> = {
        storeId,
        customerInfo: orderData.customerInfo,
        items: orderData.items,
        status: 'pending',
        paymentMethod: 'pix',
        paymentStatus: 'pending',
        total: orderData.breakdown.total,
        shipping: orderData.shipping,
        discount: orderData.discount,
        breakdown: orderData.breakdown,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ordersRef = collection(db, 'stores', storeId, 'orders');
      const docRef = await addDoc(ordersRef, order);

      console.log('✅ Pedido criado com sucesso:', {
        orderId: docRef.id,
        total: order.total,
        breakdown: order.breakdown,
        discount: order.discount,
        shipping: order.shipping
      });

      return { 
        success: true, 
        orderId: docRef.id 
      };
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      return { 
        success: false, 
        error: 'Erro ao processar pedido' 
      };
    }
  },

  /**
   * ✅ CORREÇÃO: Buscar pedido com fallbacks
   */
  async getOrder(storeId: string, orderId: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const data = orderSnap.data();
        
        // ✅ CORREÇÃO: Garantir todos os campos com fallbacks
        const order: Order = {
          id: orderSnap.id,
          storeId: data.storeId || storeId,
          customerInfo: data.customerInfo || {},
          items: data.items || [],
          status: data.status || 'pending',
          paymentMethod: data.paymentMethod || 'pix',
          paymentStatus: data.paymentStatus || 'pending',
          total: data.total || 0,
          shipping: data.shipping,
          discount: data.discount,
          breakdown: data.breakdown || {
            subtotal: data.total || 0,
            shippingCost: data.shipping?.cost || 0,
            discountAmount: data.discount?.discountAmount || 0,
            total: data.total || 0
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        console.log('📦 Pedido carregado:', {
          id: order.id,
          total: order.total,
          breakdown: order.breakdown,
          discount: order.discount,
          shipping: order.shipping
        });

        return order;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  },

  async getStoreOrders(storeId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(db, 'stores', storeId, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          breakdown: data.breakdown || {
            subtotal: data.total || 0,
            shippingCost: data.shipping?.cost || 0,
            discountAmount: data.discount?.discountAmount || 0,
            total: data.total || 0
          }
        } as Order;
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos da loja:', error);
      return [];
    }
  },

  async updateOrderStatus(storeId: string, orderId: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  },

  // Atualizar status de pagamento
  async updatePaymentStatus(storeId: string, orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const orderRef = doc(storeRef, 'orders', orderId);

      await updateDoc(orderRef, {
        paymentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      throw new Error('Falha ao atualizar status de pagamento');
    }
  },

  // Atualizar pedido completo
  async updateOrder(storeId: string, orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const orderRef = doc(storeRef, 'orders', orderId);

      await updateDoc(orderRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw new Error('Falha ao atualizar pedido');
    }
  },

  // Deletar pedido
  async deleteOrder(storeId: string, orderId: string): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const orderRef = doc(storeRef, 'orders', orderId);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Erro ao deletar pedido:', error);
      throw new Error('Falha ao deletar pedido');
    }
  },

  // Buscar pedidos por cliente
  async getOrdersByCustomer(storeId: string, customerEmail: string): Promise<Order[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const ordersQuery = query(
        collection(storeRef, 'orders'),
        where('customerInfo.email', '==', customerEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos do cliente:', error);
      return [];
    }
  },

  // Atualizar estoque quando pedido é criado
  async updateInventoryOnOrder(storeId: string, items: OrderItem[]): Promise<void> {
    try {
      // Esta função será removida pois o estoque será atualizado
      // quando o pedido for confirmado, não quando criado
      console.log('📦 OrderService: Estoque será atualizado quando pedido for confirmado');
    } catch (error) {
      console.error('Erro no updateInventoryOnOrder:', error);
    }
  },

  async confirmOrder(storeId: string, orderId: string): Promise<void> {
    try {
      const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'confirmed',
        paymentStatus: 'confirmed',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      throw error;
    }
  },

  async cancelOrder(storeId: string, orderId: string): Promise<void> {
    try {
      const orderRef = doc(db, 'stores', storeId, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      throw error;
    }
  },

  // Estatísticas de pedidos
  async getOrderStats(storeId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    revenue: number;
  }> {
    try {
      const orders = await this.getStoreOrders(storeId);

      return {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'shipped').length,
        revenue: orders
          .filter(o => o.paymentStatus === 'confirmed')
          .reduce((sum, order) => sum + order.total, 0)
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, pending: 0, confirmed: 0, revenue: 0 };
    }
  }
};