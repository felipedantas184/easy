'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Store } from '@/types/store';
import { PixSettings } from '@/components/admin/PixSettings';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

export default function StoreSettingsPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleStoreUpdate = async (updates: Partial<Store>) => {
    if (!store) return;

    setSaving(true);
    try {
      await storeServiceNew.updateStore(store.id, updates);
      
      // Atualizar estado local
      setStore(prev => prev ? { ...prev, ...updates } : null);
      
      // Recarregar para garantir sincronização
      await loadStore();
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="bg-white rounded-lg border p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
            A loja que você está tentando editar não existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
          <p className="text-gray-600 mt-1">
            Configure as opções de pagamento e outras configurações da {store.name}
          </p>
        </div>
        
        <Button disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Abas de Configuração */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
              Pagamento PIX
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
              Informações Gerais
            </button>
            <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
              Entregas
            </button>
          </nav>
        </div>

        <div className="p-6">
          <PixSettings store={store} onUpdate={handleStoreUpdate} />
        </div>
      </div>
    </div>
  );
}