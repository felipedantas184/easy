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
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { Order, OrderStatus, PaymentStatus, OrderItem } from '@/types/order';

export const orderServiceNew = {
  // Criar pedido na subcollection
  async createOrder(storeId: string, orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      
      const order: Omit<Order, 'id'> = {
        ...orderData,
        createdAt: serverTimestamp() as any,
      };

      const orderRef = await addDoc(collection(storeRef, 'orders'), order);
      
      // Atualizar estoque dos produtos/variantes
      await this.updateInventoryOnOrder(storeId, orderData.items);
      
      return orderRef.id;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw new Error('Falha ao criar pedido');
    }
  },

  // Buscar pedido por ID
  async getOrder(storeId: string, orderId: string): Promise<Order | null> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const orderDoc = await getDoc(doc(storeRef, 'orders', orderId));

      if (orderDoc.exists()) {
        const data = orderDoc.data();
        return {
          id: orderDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  },

  // Buscar todos os pedidos da loja
  async getStoreOrders(storeId: string, status?: OrderStatus): Promise<Order[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      
      let ordersQuery;
      if (status) {
        ordersQuery = query(
          collection(storeRef, 'orders'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      } else {
        ordersQuery = query(
          collection(storeRef, 'orders'),
          orderBy('createdAt', 'desc')
        );
      }

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
      console.error('Erro ao buscar pedidos da loja:', error);
      return [];
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(storeId: string, orderId: string, status: OrderStatus): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const orderRef = doc(storeRef, 'orders', orderId);
      
      await updateDoc(orderRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      throw new Error('Falha ao atualizar status');
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
      const batch = writeBatch(db);
      
      for (const item of items) {
        if (item.variant?.optionId) {
          // Atualizar estoque da variante
          const variantQuery = query(
            collection(doc(db, 'stores', storeId), 'product_variants'),
            where('id', '==', item.variant.optionId)
          );
          
          const variantSnapshot = await getDocs(variantQuery);
          if (!variantSnapshot.empty) {
            const variantDoc = variantSnapshot.docs[0];
            const currentStock = variantDoc.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            
            batch.update(variantDoc.ref, { 
              stock: newStock,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      // Não lançar erro para não falhar a criação do pedido
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