import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { storeService } from '@/lib/firebase/firestore';

export function useStore(slug: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        setError(null);
        
        const storeData = await storeService.getStoreBySlug(slug);
        
        if (!storeData) {
          setError('Loja não encontrada');
          return;
        }

        setStore(storeData);
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
        setError('Erro ao carregar loja');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadStore();
    }
  }, [slug]);

  return { store, loading, error };
}