// lib/firebase/store-service-new.ts
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
import { Store, CreateStoreData } from '@/types/store';
import { DEFAULT_STORE_THEME } from '@/lib/utils/constants';

export const storeServiceNew = {
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
          expirationTime: 30,
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
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Store;
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

  // Buscar lojas do usuário
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