'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StoreForm } from '@/components/admin/StoreForm';
import { Store } from '@/types/store';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

export default function EditStorePage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStore();
  }, [storeId]);

  const loadStore = async () => {
    try {
      const storeData = await storeServiceNew.getStore(storeId);
      setStore(storeData);
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-1/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loja Não Encontrada</h1>
          <p className="text-gray-600 mt-1">
            A loja que você está tentando editar não existe ou você não tem acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Loja</h1>
        <p className="text-gray-600 mt-1">
          Faça alterações na configuração da sua loja
        </p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <StoreForm store={store} onSuccess={loadStore} />
      </div>
    </div>
  );
}