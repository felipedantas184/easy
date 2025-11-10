'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function DebugStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      // Buscar todas as lojas (para debug)
      const q = query(collection(db, 'stores'));
      const querySnapshot = await getDocs(q);
      const allStores = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Store));
      
      setStores(allStores);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando lojas...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Debug - Todas as Lojas</h1>
      
      <div className="grid gap-4">
        {stores.map((store) => (
          <div key={store.id} className="border p-4 rounded">
            <h3 className="font-bold">{store.name}</h3>
            <p>Slug: {store.slug}</p>
            <p>ID: {store.id}</p>
            <p>Ativa: {store.isActive ? 'Sim' : 'Não'}</p>
            <p>Criada em: {store.createdAt.toLocaleDateString()}</p>
            <div className="mt-2">
              <a 
                href={`/${store.slug}`} 
                target="_blank"
                className="text-blue-600 underline"
              >
                Ver Loja: /{store.slug}
              </a>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-8">
          <p>Nenhuma loja encontrada no banco de dados.</p>
          <Button onClick={loadStores} className="mt-4">
            Recarregar
          </Button>
        </div>
      )}
    </div>
  );
}