'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Store } from '@/types/store';
import { PixSettings } from '@/components/admin/PixSettings';
import { Button } from '@/components/ui/button';
import { Save, Truck, CreditCard, Settings, Store as StoreIcon } from 'lucide-react';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { ShippingSettingsComponent } from '@/components/admin/ShippingSettings';

type SettingsTab = 'pix' | 'shipping' | 'general';

export default function SettingsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('pix');

  // Carregar lojas do usuário
  useEffect(() => {
    async function loadStores() {
      if (user) {
        try {
          const userStores = await storeServiceNew.getUserStores(user.id);
          setStores(userStores);
          
          // Selecionar primeira loja por padrão
          if (userStores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(userStores[0].id);
          }
        } catch (error) {
          console.error('Erro ao carregar lojas:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadStores();
  }, [user, selectedStoreId]);

  // Carregar dados da loja selecionada
  useEffect(() => {
    async function loadSelectedStore() {
      if (selectedStoreId) {
        try {
          const storeData = await storeServiceNew.getStore(selectedStoreId);
          setSelectedStore(storeData);
        } catch (error) {
          console.error('Erro ao carregar loja:', error);
          setSelectedStore(null);
        }
      } else {
        setSelectedStore(null);
      }
    }

    loadSelectedStore();
  }, [selectedStoreId]);

  const handleStoreUpdate = async (updates: Partial<Store>) => {
    if (!selectedStore) return;

    setSaving(true);
    try {
      await storeServiceNew.updateStore(selectedStore.id, updates);
      
      // Atualizar estado local
      setSelectedStore(prev => prev ? { ...prev, ...updates } : null);
      
      // Recarregar para garantir sincronização
      const storeData = await storeServiceNew.getStore(selectedStore.id);
      setSelectedStore(storeData);
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

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">Configure as opções das suas lojas</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <StoreIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Você precisa criar uma loja antes de configurar as opções.
          </p>
          <Button size="lg">
            <a href="/dashboard/stores/new">
              <StoreIcon className="w-5 h-5 mr-2" />
              Criar Primeira Loja
            </a>
          </Button>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">
            Configure as opções de pagamento, frete e outras configurações das suas lojas
          </p>
        </div>
        
        <Button disabled={saving || !selectedStore}>
          <Save size={16} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Store Selector */}
      <div className="bg-white rounded-lg border p-6">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Loja
        </label>
        <select
          id="store-select"
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecione uma loja</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        
        {selectedStore && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <StoreIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">{selectedStore.name}</h4>
                <p className="text-sm text-blue-700">
                  {selectedStore.slug}.easyplatform.com
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configurações da Loja Selecionada */}
      {selectedStore ? (
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
              <PixSettings store={selectedStore} onUpdate={handleStoreUpdate} />
            )} */}
            
            {activeTab === 'shipping' && (
              <ShippingSettingsComponent store={selectedStore} onUpdate={handleStoreUpdate} />
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
      ) : (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Selecione uma loja
          </h3>
          <p className="text-gray-600">
            Escolha uma loja para visualizar e configurar as opções.
          </p>
        </div>
      )}
    </div>
  );
}