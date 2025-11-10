'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Store as StoreIcon, Plus } from 'lucide-react';
import { StoreCard } from '@/components/admin/StoreCard';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

export default function StoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  const loadStores = async () => {
    try {
      const userStores = await storeServiceNew.getUserStores(user!.id);
      setStores(userStores);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Lojas</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as suas lojas virtuais</p>
          </div>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="w-3/4 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Lojas</h1>
          <p className="text-gray-600 mt-1">
            {stores.length === 0 
              ? 'Crie sua primeira loja virtual' 
              : `Você tem ${stores.length} loja(s) ativa(s)`
            }
          </p>
        </div>
        <Link href="/dashboard/stores/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {/* Stores Grid */}
      {stores.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <StoreIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Crie sua primeira loja virtual para começar a vender online. 
            É rápido, fácil e não requer conhecimento técnico.
          </p>
          <Link href="/dashboard/stores/new">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Loja
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <StoreCard 
              key={store.id} 
              store={store} 
              onUpdate={loadStores}
            />
          ))}
        </div>
      )}
    </div>
  );
}