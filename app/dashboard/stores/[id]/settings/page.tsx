// ATUALIZAR a página de configurações para incluir frete
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Store } from '@/types/store';
import { PixSettings } from '@/components/admin/PixSettings';
import { Button } from '@/components/ui/button';
import { Save, Truck, CreditCard, Settings } from 'lucide-react';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { ShippingSettingsComponent } from '@/components/admin/ShippingSettings';

type SettingsTab = 'pix' | 'shipping' | 'general';

export default function StoreSettingsPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('pix');

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

  const tabs = [
    { id: 'pix' as SettingsTab, name: 'Pagamento PIX', icon: CreditCard },
    { id: 'shipping' as SettingsTab, name: 'Configurações de Frete', icon: Truck },
    { id: 'general' as SettingsTab, name: 'Informações Gerais', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
          <p className="text-gray-600 mt-1">
            Configure as opções de pagamento, frete e outras configurações da {store.name}
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
         {/**
          {activeTab === 'pix' && (
            <PixSettings store={store} onUpdate={handleStoreUpdate} />
          )}
          
           */}
          {activeTab === 'shipping' && (
            <ShippingSettingsComponent store={store} onUpdate={handleStoreUpdate} />
          )}
          
          {activeTab === 'general' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Configurações Gerais
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Em breve você poderá configurar informações gerais da sua loja como 
                informações de contato, políticas e muito mais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}