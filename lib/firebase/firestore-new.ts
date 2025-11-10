// lib/firebase/firestore-new.ts
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
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import {
  Product,
  ProductVariant,
  VariantOption,
  DiscountCoupon,
  Order,
  OrderStatus,
  PaymentStatus
} from '@/types';
import { ProductVariantSubcollection, ProductWithSubcollections } from '@/types/product-subcollections';

// ==================== PRODUCTS WITH SUBCOLLECTIONS ====================

export const productServiceNew = {
  // Criar produto na subcollection
  async createProduct(productData: Omit<Product, 'id'>, storeId: string): Promise<string> {
    const storeRef = doc(db, 'stores', storeId);

    // 1. Criar produto principal na subcollection
    const product: Omit<ProductWithSubcollections, 'id'> = {
      storeId,
      name: productData.name,
      description: productData.description,
      images: productData.images,
      category: productData.category,
      isActive: true,
      hasVariants: productData.hasVariants,
      weight: productData.weight,
      dimensions: productData.dimensions,
      seo: productData.seo,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const productRef = await addDoc(collection(storeRef, 'products'), product);
    const productId = productRef.id;

    // 2. Se tem variantes, criar na collection separada
    if (productData.hasVariants && productData.variants) {
      await this.createProductVariants(storeId, productId, productData.variants);
    } else if (productData.variants && productData.variants.length > 0) {
      // Produto sem variações - criar única variante
      await this.createProductVariants(storeId, productId, productData.variants);
    }

    return productId;
  },

  // Criar variantes em collection separada
  async createProductVariants(storeId: string, productId: string, variants: ProductVariant[]): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const batch = writeBatch(db);

    for (const variant of variants) {
      for (const option of variant.options) {
        const variantData: Omit<ProductVariantSubcollection, 'id'> = {
          productId,
          storeId,

          // ✅ NOVO: Preservar grupo
          variantGroup: variant.name,     // "Armazenamento"
          variantGroupId: variant.id,     // "storage"

          // ✅ MUDAR: name → optionName
          optionName: option.name,        // "128Gb"
          optionValue: option.name.toLowerCase().replace(/\s+/g, '-'), // "128gb"

          price: option.price,
          comparePrice: option.comparePrice,
          stock: option.stock,
          sku: option.sku,
          // barcode: option.barcode,
          //weight: option.weight,
          isActive: option.isActive,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        const variantRef = doc(collection(storeRef, 'product_variants'));
        batch.set(variantRef, variantData);
      }
    }

    await batch.commit();
  },

  // Buscar produto por ID
  async getProduct(storeId: string, productId: string): Promise<Product | null> {
    try {
      console.log('🔍 getProduct: Buscando produto', { storeId, productId });

      const storeRef = doc(db, 'stores', storeId);
      const productDocRef = doc(storeRef, 'products', productId);
      const productDoc = await getDoc(productDocRef);

      if (!productDoc.exists()) {
        console.log('❌ getProduct: Produto não encontrado');
        return null;
      }

      const productData = productDoc.data();
      console.log('📦 getProduct: Dados do produto', productData);

      const product = {
        id: productDoc.id,
        ...productData,
        createdAt: productData.createdAt?.toDate() || new Date(),
        updatedAt: productData.updatedAt?.toDate() || new Date(),
      } as ProductWithSubcollections;

      // Buscar variantes da collection separada
      const variants = await this.getProductVariants(storeId, productId);
      console.log('🎯 getProduct: Variantes encontradas', variants);

      return {
        ...product,
        variants: variants
      } as Product;
    } catch (error) {
      console.error('❌ getProduct: Erro ao buscar produto:', error);
      return null;
    }
  },

  // Buscar variantes do produto
  async getProductVariants(storeId: string, productId: string): Promise<ProductVariant[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const q = query(
        collection(storeRef, 'product_variants'),
        where('productId', '==', productId),
        orderBy('variantGroup'), // ✅ Ordenar por grupo
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [{
          id: 'default',
          name: 'Padrão',
          options: [{
            id: 'default-option',
            name: 'Único',
            price: 0,
            stock: 0,
            sku: '',
            isActive: true
          }]
        }];
      }

      // ✅ CORREÇÃO: Agrupar por variantGroup
      const variantsMap = new Map<string, ProductVariant>();

      querySnapshot.docs.forEach(doc => {
        const variantData = doc.data();
        const groupId = variantData.variantGroupId || 'default';
        const groupName = variantData.variantGroup || 'Padrão';

        if (!variantsMap.has(groupId)) {
          variantsMap.set(groupId, {
            id: groupId,
            name: groupName,
            options: []
          });
        }

        const variant = variantsMap.get(groupId)!;
        variant.options.push({
          id: doc.id,
          name: variantData.optionName || variantData.name, // ✅ Backward compatibility
          price: variantData.price,
          comparePrice: variantData.comparePrice,
          stock: variantData.stock,
          sku: variantData.sku,
          // barcode: variantData.barcode,
          // weight: variantData.weight,
          isActive: variantData.isActive
        });
      });

      return Array.from(variantsMap.values());
    } catch (error) {
      console.error('Erro ao buscar variantes:', error);
      return [];
    }
  },

  // Buscar produtos da loja
  async getStoreProducts(storeId: string): Promise<Product[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const q = query(
        collection(storeRef, 'products'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      for (const doc of querySnapshot.docs) {
        const productData = doc.data();
        const product = {
          id: doc.id,
          ...productData,
          createdAt: productData.createdAt?.toDate() || new Date(),
          updatedAt: productData.updatedAt?.toDate() || new Date(),
        } as ProductWithSubcollections;

        // Buscar variantes para cada produto
        const variants = await this.getProductVariants(storeId, doc.id);

        products.push({
          ...product,
          variants: variants
        } as Product);
      }

      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos da loja:', error);
      return [];
    }
  },

  // Atualizar produto
  async updateProduct(storeId: string, productId: string, updates: Partial<Product>): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const productRef = doc(storeRef, 'products', productId);

    // Remover variants dos updates (são gerenciadas separadamente)
    const { variants, ...productUpdates } = updates;

    await updateDoc(productRef, {
      ...productUpdates,
      updatedAt: serverTimestamp(),
    });

    // Se variants foram fornecidas, atualizar collection separada
    if (variants) {
      // Primeiro deletar variantes existentes
      await this.deleteProductVariants(storeId, productId);
      // Depois criar novas
      if (variants.length > 0) {
        await this.createProductVariants(storeId, productId, variants);
      }
    }
  },

  // Deletar variantes do produto
  async deleteProductVariants(storeId: string, productId: string): Promise<void> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const q = query(
        collection(storeRef, 'product_variants'),
        where('productId', '==', productId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao deletar variantes:', error);
    }
  },

  // Deletar produto (soft delete)
  async deleteProduct(storeId: string, productId: string): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const productRef = doc(storeRef, 'products', productId);

    await updateDoc(productRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  // Buscar produtos por categoria
  async getProductsByCategory(storeId: string, category: string): Promise<Product[]> {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const q = query(
        collection(storeRef, 'products'),
        where('storeId', '==', storeId),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      for (const doc of querySnapshot.docs) {
        const productData = doc.data();
        const product = {
          id: doc.id,
          ...productData,
          createdAt: productData.createdAt?.toDate() || new Date(),
          updatedAt: productData.updatedAt?.toDate() || new Date(),
        } as ProductWithSubcollections;

        const variants = await this.getProductVariants(storeId, doc.id);

        products.push({
          ...product,
          variants: variants
        } as Product);
      }

      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos por categoria:', error);
      return [];
    }
  }
};

// ==================== ORDERS WITH SUBCOLLECTIONS ====================

export const orderServiceNew = {
  async createOrder(storeId: string, orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const storeRef = doc(db, 'stores', storeId);

    const order: Omit<Order, 'id'> = {
      ...orderData,
      createdAt: serverTimestamp() as any,
    };

    const orderRef = await addDoc(collection(storeRef, 'orders'), order);
    return orderRef.id;
  },

  async getOrder(storeId: string, orderId: string): Promise<Order | null> {
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
  },

  async getStoreOrders(storeId: string): Promise<Order[]> {
    const storeRef = doc(db, 'stores', storeId);
    const q = query(
      collection(storeRef, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    });
  },

  async updateOrderStatus(storeId: string, orderId: string, status: OrderStatus): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const orderRef = doc(storeRef, 'orders', orderId);
    await updateDoc(orderRef, { status });
  },

  async updatePaymentStatus(storeId: string, orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const orderRef = doc(storeRef, 'orders', orderId);
    await updateDoc(orderRef, { paymentStatus });
  },

  async updateOrder(storeId: string, orderId: string, updates: Partial<Order>): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const orderRef = doc(storeRef, 'orders', orderId);
    await updateDoc(orderRef, updates);
  },

  async deleteOrder(storeId: string, orderId: string): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const orderRef = doc(storeRef, 'orders', orderId);
    await deleteDoc(orderRef);
  },
};

// ==================== DISCOUNTS WITH SUBCOLLECTIONS ====================

export { discountServiceNew } from './discount-service-new';