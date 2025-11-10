'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Store } from '@/types/store';
import { storeServiceNew } from '@/lib/firebase/firestore-new';

interface StoreContextType {
  store: Store | null;
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ 
  children, 
  slug 
}: { 
  children: React.ReactNode;
  slug: string;
}) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 StoreProvider: Buscando loja com slug:', slug); // DEBUG
        
        if (!slug) {
          console.error('❌ StoreProvider: Slug não fornecido');
          setError('Slug não fornecido');
          setLoading(false);
          return;
        }

        const storeData = await storeServiceNew.getStoreBySlug(slug);
        
        console.log('✅ StoreProvider: Loja encontrada:', storeData); // DEBUG
        
        if (!storeData) {
          console.log('❌ StoreProvider: Loja não encontrada');
          setError('Loja não encontrada');
          return;
        }

        setStore(storeData);
      } catch (err) {
        console.error('❌ StoreProvider: Erro ao carregar loja:', err);
        setError('Erro ao carregar loja');
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [slug]);

  const value: StoreContextType = {
    store,
    loading,
    error,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};