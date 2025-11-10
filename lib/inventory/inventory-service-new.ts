// lib/inventory/inventory-service-new.ts - SISTEMA COMPLETO DE ESTOQUE
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderItem, OrderStatus } from '@/types/order';
import { StockMovement, StockAlert } from '@/types/inventory';

export const inventoryServiceNew = {
  /**
   * Atualizar estoque quando pedido é criado/confirmado
   */
  async updateStockOnOrder(storeId: string, orderId: string, items: OrderItem[]): Promise<void> {
    try {
      console.log('📦 InventoryService: Atualizando estoque para pedido', {
        storeId,
        orderId,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variant?.optionId,
          quantity: item.quantity
        }))
      });

      const batch = writeBatch(db);
      const storeRef = doc(db, 'stores', storeId);

      for (const item of items) {
        if (item.variant?.optionId) {
          console.log('🔍 Procurando variante com ID:', item.variant.optionId);

          // ✅ CORREÇÃO: Usar referência direta ao documento em vez de query
          const variantRef = doc(storeRef, 'product_variants', item.variant.optionId);

          try {
            const variantDoc = await getDoc(variantRef);

            if (variantDoc.exists()) {
              const variantData = variantDoc.data();
              const currentStock = variantData.stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);

              console.log('📊 DETALHES DA VARIANTE:', {
                variantId: item.variant.optionId,
                productId: item.productId,
                currentStock,
                quantityToRemove: item.quantity,
                newStock,
                variantExists: true,
                variantData: {
                  id: variantDoc.id,
                  productId: variantData.productId,
                  optionName: variantData.optionName,
                  stock: variantData.stock
                }
              });

              batch.update(variantRef, {
                stock: newStock,
                updatedAt: serverTimestamp()
              });

              await this.createStockMovement({
                productId: item.productId,
                variantOptionId: item.variant.optionId,
                type: 'out',
                quantity: item.quantity,
                reason: `Venda - Pedido #${orderId}`,
                reference: orderId,
                createdBy: 'system'
              });
            } else {
              console.error('❌ Variante não encontrada com referência direta:', item.variant.optionId);

              // ✅ FALLBACK: Tentar buscar por productId + optionName
              console.log('🔄 Tentando fallback: buscar variante por productId...');
              await this.fallbackStockUpdate(storeId, item, orderId, batch);
            }
          } catch (error) {
            console.error('❌ Erro ao acessar variante:', error);
          }
        } else {
          console.log('⚠️ Item sem variante específica, procurando variante padrão...');
          // ✅ ATUALIZAR ESTOQUE DO PRODUTO SEM VARIANTES
          // Buscar a primeira variante do produto (produto sem variações)
          const productVariantsQuery = query(
            collection(storeRef, 'product_variants'),
            where('productId', '==', item.productId),
            orderBy('createdAt', 'asc')
          );

          const variantsSnapshot = await getDocs(productVariantsQuery);
          if (!variantsSnapshot.empty) {
            const variantDoc = variantsSnapshot.docs[0];
            const currentStock = variantDoc.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);

            console.log(`🔄 Atualizando produto ${item.productId}: ${currentStock} → ${newStock} (-${item.quantity})`);

            batch.update(variantDoc.ref, {
              stock: newStock,
              updatedAt: serverTimestamp()
            });

            // ✅ REGISTRAR MOVIMENTAÇÃO DE ESTOQUE
            await this.createStockMovement({
              productId: item.productId,
              variantOptionId: variantDoc.id,
              type: 'out',
              quantity: item.quantity,
              reason: `Venda - Pedido #${orderId}`,
              reference: orderId,
              createdBy: 'system'
            });
          }
        }
      }

      await batch.commit();
      console.log('✅ InventoryService: Batch commit realizado com sucesso');

    } catch (error) {
      console.error('❌ InventoryService: Erro ao atualizar estoque:', error);
      throw error;
    }
  },

  async fallbackStockUpdate(storeId: string, item: OrderItem, orderId: string, batch: any): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);

      // Buscar todas as variantes do produto
      const variantsQuery = query(
        collection(storeRef, 'product_variants'),
        where('productId', '==', item.productId)
      );

      const variantsSnapshot = await getDocs(variantsQuery);
      console.log(`🔍 Fallback: ${variantsSnapshot.docs.length} variantes encontradas para produto ${item.productId}`);

      if (variantsSnapshot.docs.length > 0) {
        // Usar a primeira variante (assumindo que é a única ou principal)
        const variantDoc = variantsSnapshot.docs[0];
        const variantData = variantDoc.data();
        const currentStock = variantData.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        console.log('📊 Fallback - Atualizando variante:', {
          variantId: variantDoc.id,
          optionName: variantData.optionName,
          currentStock,
          newStock
        });

        batch.update(variantDoc.ref, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });

        await this.createStockMovement({
          productId: item.productId,
          variantOptionId: variantDoc.id,
          type: 'out',
          quantity: item.quantity,
          reason: `Venda (Fallback) - Pedido #${orderId}`,
          reference: orderId,
          createdBy: 'system'
        });
      } else {
        console.error('❌ Fallback: Nenhuma variante encontrada para o produto');
      }
    } catch (error) {
      console.error('❌ Erro no fallback:', error);
    }
  },

  /**
   * Restaurar estoque quando pedido é cancelado
   */
  async restoreStockOnCancel(storeId: string, orderId: string, items: OrderItem[]): Promise<void> {
    try {
      console.log('🔄 InventoryService: Restaurando estoque do pedido cancelado', { storeId, orderId });

      const batch = writeBatch(db);
      const storeRef = doc(db, 'stores', storeId);

      for (const item of items) {
        if (item.variant?.optionId) {
          // ✅ RESTAURAR ESTOQUE DA VARIANTE
          const variantQuery = query(
            collection(storeRef, 'product_variants'),
            where('id', '==', item.variant.optionId)
          );

          const variantSnapshot = await getDocs(variantQuery);
          if (!variantSnapshot.empty) {
            const variantDoc = variantSnapshot.docs[0];
            const currentStock = variantDoc.data().stock || 0;
            const newStock = currentStock + item.quantity;

            console.log(`🔄 Restaurando variante ${item.variant.optionId}: ${currentStock} → ${newStock} (+${item.quantity})`);

            batch.update(variantDoc.ref, {
              stock: newStock,
              updatedAt: serverTimestamp()
            });

            // ✅ REGISTRAR MOVIMENTAÇÃO DE ESTOQUE
            await this.createStockMovement({
              productId: item.productId,
              variantOptionId: item.variant.optionId,
              type: 'in',
              quantity: item.quantity,
              reason: `Cancelamento - Pedido #${orderId}`,
              reference: orderId,
              createdBy: 'system'
            });
          }
        } else {
          // ✅ RESTAURAR ESTOQUE DO PRODUTO SEM VARIANTES
          const productVariantsQuery = query(
            collection(storeRef, 'product_variants'),
            where('productId', '==', item.productId),
            orderBy('createdAt', 'asc')
          );

          const variantsSnapshot = await getDocs(productVariantsQuery);
          if (!variantsSnapshot.empty) {
            const variantDoc = variantsSnapshot.docs[0];
            const currentStock = variantDoc.data().stock || 0;
            const newStock = currentStock + item.quantity;

            console.log(`🔄 Restaurando produto ${item.productId}: ${currentStock} → ${newStock} (+${item.quantity})`);

            batch.update(variantDoc.ref, {
              stock: newStock,
              updatedAt: serverTimestamp()
            });

            await this.createStockMovement({
              productId: item.productId,
              variantOptionId: variantDoc.id,
              type: 'in',
              quantity: item.quantity,
              reason: `Cancelamento - Pedido #${orderId}`,
              reference: orderId,
              createdBy: 'system'
            });
          }
        }
      }

      await batch.commit();
      console.log('✅ InventoryService: Estoque restaurado com sucesso');

    } catch (error) {
      console.error('❌ InventoryService: Erro ao restaurar estoque:', error);
      throw new Error('Falha ao restaurar estoque');
    }
  },

  /**
   * Criar movimentação de estoque (histórico)
   */
  async createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<string> {
    try {
      const movementData = {
        ...movement,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'stock_movements'), movementData);
      console.log('📝 InventoryService: Movimentação registrada:', docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('❌ InventoryService: Erro ao registrar movimentação:', error);
      throw new Error('Falha ao registrar movimentação de estoque');
    }
  },

  /**
   * Buscar histórico de movimentações de um produto/variante
   */
  async getStockHistory(productId: string, variantOptionId?: string): Promise<StockMovement[]> {
    try {
      let stockQuery;

      if (variantOptionId) {
        stockQuery = query(
          collection(db, 'stock_movements'),
          where('productId', '==', productId),
          where('variantOptionId', '==', variantOptionId),
          orderBy('createdAt', 'desc')
        );
      } else {
        stockQuery = query(
          collection(db, 'stock_movements'),
          where('productId', '==', productId),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(stockQuery);
      const movements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as StockMovement;
      });

      console.log(`📊 InventoryService: ${movements.length} movimentações encontradas para ${productId}`);
      return movements;
    } catch (error) {
      console.error('❌ InventoryService: Erro ao buscar histórico:', error);
      return [];
    }
  },

  /**
   * Verificar alertas de estoque baixo
   */
  async checkLowStockAlerts(storeId: string, threshold: number = 5): Promise<StockAlert[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const variantsQuery = query(
        collection(storeRef, 'product_variants'),
        where('stock', '<=', threshold),
        where('stock', '>', 0),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(variantsQuery);
      const alerts: StockAlert[] = [];

      for (const doc of querySnapshot.docs) {
        const variantData = doc.data();
        alerts.push({
          id: doc.id,
          productId: variantData.productId,
          variantOptionId: doc.id,
          currentStock: variantData.stock || 0,
          threshold,
          notified: false,
          createdAt: new Date(),
        });
      }

      console.log(`⚠️ InventoryService: ${alerts.length} alertas de estoque baixo`);
      return alerts;
    } catch (error) {
      console.error('❌ InventoryService: Erro ao verificar alertas:', error);
      return [];
    }
  },

  /**
   * Ajuste manual de estoque
   */
  async adjustStockManually(
    storeId: string,
    productId: string,
    variantOptionId: string,
    adjustment: number,
    reason: string,
    userId: string
  ): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const variantQuery = query(
        collection(storeRef, 'product_variants'),
        where('id', '==', variantOptionId)
      );

      const variantSnapshot = await getDocs(variantQuery);
      if (variantSnapshot.empty) {
        throw new Error('Variante não encontrada');
      }

      const variantDoc = variantSnapshot.docs[0];
      const currentStock = variantDoc.data().stock || 0;
      const newStock = Math.max(0, currentStock + adjustment);

      await updateDoc(variantDoc.ref, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });

      // Registrar movimentação
      await this.createStockMovement({
        productId,
        variantOptionId,
        type: adjustment >= 0 ? 'in' : 'out',
        quantity: Math.abs(adjustment),
        reason,
        reference: `manual_adjustment_${Date.now()}`,
        createdBy: userId
      });

      console.log(`🔧 InventoryService: Estoque ajustado manualmente: ${currentStock} → ${newStock}`);
    } catch (error) {
      console.error('❌ InventoryService: Erro no ajuste manual:', error);
      throw new Error('Falha ao ajustar estoque');
    }
  }
};