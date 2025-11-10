/**
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
  increment
} from 'firebase/firestore';
import { db } from './config';
import { Store, CreateStoreData } from '@/types/store';
import { DEFAULT_STORE_THEME } from '../utils/constants';
import { DiscountCoupon, Order, OrderStatus, PaymentStatus, Product } from '@/types';

// Operações de Loja
export const storeService = {
  // Criar nova loja
  async createStore(storeData: CreateStoreData, ownerId: string): Promise<string> {
    const store: Omit<Store, 'id'> = {
      ownerId,
      slug: storeData.slug,
      name: storeData.name,
      description: storeData.description,
      theme: {
        ...DEFAULT_STORE_THEME,
        primaryColor: storeData.primaryColor || DEFAULT_STORE_THEME.primaryColor,
        secondaryColor: storeData.secondaryColor || DEFAULT_STORE_THEME.secondaryColor,
      },
      contact: {
        email: '',
        pixKeys: [],
      },
      settings: {
        allowPickup: true,
        requireCustomerAuth: false,
        maintenanceMode: false,
        pixSettings: {
          expirationTime: 30, // 30 minutos
          allowMultipleKeys: true,
        },
      },
      isActive: true,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await addDoc(collection(db, 'stores'), store);
    return docRef.id;
  },

  // Buscar loja por ID
  async getStore(storeId: string): Promise<Store | null> {
    const docRef = doc(db, 'stores', storeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Store;
    }
    return null;
  },

  // Buscar loja por slug
  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      const q = query(
        collection(db, 'stores'),
        where('slug', '==', slug),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      // CORRIGIR: Converter timestamps do Firebase
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Store;
    } catch (error) {
      console.error('Erro ao buscar loja por slug:', error);
      return null;
    }
  },

  // CORRIGIR: getUserStores
  async getUserStores(ownerId: string): Promise<Store[]> {
    try {
      const q = query(
        collection(db, 'stores'),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Store;
      });
    } catch (error) {
      console.error('Erro ao buscar lojas do usuário:', error);
      return [];
    }
  },

  // Atualizar loja
  async updateStore(storeId: string, updates: Partial<Store>): Promise<void> {
    const docRef = doc(db, 'stores', storeId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Deletar loja (soft delete)
  async deleteStore(storeId: string): Promise<void> {
    const docRef = doc(db, 'stores', storeId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  // Verificar se slug está disponível
  async isSlugAvailable(slug: string): Promise<boolean> {
    const q = query(
      collection(db, 'stores'),
      where('slug', '==', slug),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  },
};

export const productService = {
  async createProduct(productData: Omit<Product, 'id'>, storeId: string): Promise<string> {
    const product: Omit<Product, 'id'> = {
      ...productData,
      storeId,
      isActive: true,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await addDoc(collection(db, 'products'), product);
    return docRef.id;
  },

  async getProduct(productId: string): Promise<Product | null> {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // ✅ REMOVIDOS: conversões de basePrice, totalStock, etc.
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    }
    return null;
  },

  async getStoreProducts(storeId: string): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('storeId', '==', storeId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProduct(productId: string): Promise<void> {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  async getProductsByCategory(storeId: string, category: string): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('storeId', '==', storeId),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  },
};

export const orderService = {
  // Criar novo pedido
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    // ✅ GARANTIR que todos os campos estejam definidos
    const order: Omit<Order, 'id'> = {
      storeId: orderData.storeId,
      customerInfo: {
        name: orderData.customerInfo.name || '',
        email: orderData.customerInfo.email || '',
        phone: orderData.customerInfo.phone || '',
        address: orderData.customerInfo.address || '',
        city: orderData.customerInfo.city || '',
        state: orderData.customerInfo.state || '',
        zipCode: orderData.customerInfo.zipCode || '',
      },
      items: orderData.items.map(item => ({
        productId: item.productId || '',
        productName: item.productName || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        ...(item.variant ? {
          variant: {
            variantId: item.variant.variantId || '',
            optionId: item.variant.optionId || '',
            optionName: item.variant.optionName || '',
            price: item.variant.price || 0,
          }
        } : {}),
      })),
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod || 'pix',
      paymentStatus: orderData.paymentStatus || 'pending',
      total: orderData.total || 0,
      createdAt: serverTimestamp() as any,
    };

    console.log('📦 Criando pedido no Firebase:', order); // DEBUG

    const docRef = await addDoc(collection(db, 'orders'), order);

    console.log('✅ Pedido criado com ID:', docRef.id); // DEBUG

    return docRef.id;
  },

  // Buscar pedido por ID
  async getOrder(orderId: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Order;
    }
    return null;
  },

  // Buscar pedidos de uma loja
  async getStoreOrders(storeId: string): Promise<Order[]> {
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
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

  // Atualizar status do pedido
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
  },

  // Atualizar status de pagamento
  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<void> {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { paymentStatus });
  },
};

export const discountService = {
  // Criar novo cupom
  async createCoupon(couponData: Omit<DiscountCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const coupon: Omit<DiscountCoupon, 'id'> = {
      ...couponData,
      usedCount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await addDoc(collection(db, 'discountCoupons'), coupon);
    return docRef.id;
  },

  // Buscar cupom por ID
  async getCoupon(couponId: string): Promise<DiscountCoupon | null> {
    const docRef = doc(db, 'discountCoupons', couponId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DiscountCoupon;
    }
    return null;
  },

  // Buscar cupom por código e loja
  async getCouponByCode(storeId: string, code: string): Promise<DiscountCoupon | null> {
    const q = query(
      collection(db, 'discountCoupons'),
      where('storeId', '==', storeId),
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      validFrom: data.validFrom?.toDate() || new Date(),
      validUntil: data.validUntil?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as DiscountCoupon;
  },

  // Buscar cupons de uma loja
  async getStoreCoupons(storeId: string): Promise<DiscountCoupon[]> {
    const q = query(
      collection(db, 'discountCoupons'),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as DiscountCoupon;
    });
  },

  // Atualizar cupom
  async updateCoupon(couponId: string, updates: Partial<DiscountCoupon>): Promise<void> {
    const docRef = doc(db, 'discountCoupons', couponId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Incrementar uso do cupom
  async incrementCouponUsage(couponId: string): Promise<void> {
    const docRef = doc(db, 'discountCoupons', couponId);
    await updateDoc(docRef, {
      usedCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  },

  // Deletar cupom
  async deleteCoupon(couponId: string): Promise<void> {
    const docRef = doc(db, 'discountCoupons', couponId);
    await deleteDoc(docRef);
  },
}; */