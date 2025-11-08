import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StockMovement, StockAlert } from '@/types/inventory';
import { Order } from '@/types/order';
import { Product, VariantOption } from '@/types/products';

export class InventoryService {
  // Reservar estoque para um pedido
  static async reserveStock(order: Order): Promise<void> {
    try {
      for (const item of order.items) {
        if (item.variant?.optionId) {
          // Reservar estoque de variação
          await this.createStockMovement({
            productId: item.productId,
            variantOptionId: item.variant.optionId,
            type: 'reservation',
            quantity: -item.quantity,
            reason: `Reserva para pedido #${order.id}`,
            reference: order.id,
            createdAt: new Date(),
            createdBy: 'system'
          });
        } else {
          // Reservar estoque do produto principal
          await this.createStockMovement({
            productId: item.productId,
            type: 'reservation',
            quantity: -item.quantity,
            reason: `Reserva para pedido #${order.id}`,
            reference: order.id,
            createdAt: new Date(),
            createdBy: 'system'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao reservar estoque:', error);
      throw new Error('Falha ao reservar estoque');
    }
  }

  // Liberar estoque reservado (quando pedido é cancelado)
  static async releaseStock(orderId: string): Promise<void> {
    try {
      const movements = await this.getStockMovementsByReference(orderId);
      
      for (const movement of movements) {
        await this.createStockMovement({
          productId: movement.productId,
          variantOptionId: movement.variantOptionId,
          type: 'adjustment',
          quantity: Math.abs(movement.quantity),
          reason: `Liberação de reserva do pedido #${orderId}`,
          reference: orderId,
          createdAt: new Date(),
          createdBy: 'system'
        });
      }
    } catch (error) {
      console.error('Erro ao liberar estoque:', error);
      throw new Error('Falha ao liberar estoque');
    }
  }

  // Atualizar estoque manualmente
  static async updateStock(
    productId: string, 
    variantOptionId: string | undefined, 
    quantity: number, 
    reason: string,
    userId: string
  ): Promise<void> {
    try {
      await this.createStockMovement({
        productId,
        variantOptionId,
        type: quantity >= 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        reason,
        createdAt: new Date(),
        createdBy: userId
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw new Error('Falha ao atualizar estoque');
    }
  }

  // Criar movimentação de estoque
  static async createStockMovement(movement: Omit<StockMovement, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'stockMovements'), {
      ...movement,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // Buscar histórico de estoque
  static async getStockHistory(productId: string, variantOptionId?: string): Promise<StockMovement[]> {
    let q;
    
    if (variantOptionId) {
      q = query(
        collection(db, 'stockMovements'),
        where('productId', '==', productId),
        where('variantOptionId', '==', variantOptionId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'stockMovements'),
        where('productId', '==', productId),
        where('variantOptionId', '==', null),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as StockMovement;
    });
  }

  // Verificar alertas de estoque baixo
  static async checkLowStockAlerts(storeId: string): Promise<StockAlert[]> {
    // Implementação futura - integração com sistema de notificações
    return [];
  }

  // Buscar movimentações por referência
  private static async getStockMovementsByReference(reference: string): Promise<StockMovement[]> {
    const q = query(
      collection(db, 'stockMovements'),
      where('reference', '==', reference),
      where('type', '==', 'reservation')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as StockMovement;
    });
  }

  // Calcular estoque atual
  static async calculateCurrentStock(productId: string, variantOptionId?: string): Promise<number> {
    const history = await this.getStockHistory(productId, variantOptionId);
    return history.reduce((total, movement) => {
      if (movement.type === 'in' || movement.type === 'adjustment') {
        return total + movement.quantity;
      } else {
        return total - movement.quantity;
      }
    }, 0);
  }
}