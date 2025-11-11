// components/admin/ShippingSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { Store, ShippingSettings, ShippingRegion, WeightBasedRate } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shippingService } from '@/lib/firebase/shipping-service';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { Plus, Trash2, Save, Truck, MapPin, Weight, DollarSign } from 'lucide-react';

interface ShippingSettingsProps {
  store: Store;
  onUpdate: (updates: Partial<Store>) => void;
}

export function ShippingSettingsComponent({ store, onUpdate }: ShippingSettingsProps) {
  const [settings, setSettings] = useState<ShippingSettings>(
    store.settings.shippingSettings || shippingService.getDefaultShippingSettings()
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Estados para formulários modais
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<ShippingRegion | null>(null);
  const [editingWeight, setEditingWeight] = useState<WeightBasedRate | null>(null);

  useEffect(() => {
    setSettings(store.settings.shippingSettings || shippingService.getDefaultShippingSettings());
  }, [store]);

  const validateSettings = (): boolean => {
    const validation = shippingService.validateShippingSettings(settings);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    setLoading(true);
    try {
      await storeServiceNew.updateShippingSettings(store.id, settings);
      onUpdate({
        ...store,
        settings: {
          ...store.settings,
          shippingSettings: settings
        }
      });
      alert('Configurações de frete salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculationMethodChange = (method: ShippingSettings['calculationMethod']) => {
    setSettings(prev => ({
      ...prev,
      calculationMethod: method
    }));
  };

  // Métodos para gerenciar regiões
  const addRegion = (region: Omit<ShippingRegion, 'id'>) => {
    const newRegion: ShippingRegion = {
      ...region,
      id: Date.now().toString()
    };

    setSettings(prev => ({
      ...prev,
      regionalTable: [...(prev.regionalTable || []), newRegion]
    }));
    setShowRegionModal(false);
    setEditingRegion(null);
  };

  const updateRegion = (region: ShippingRegion) => {
    setSettings(prev => ({
      ...prev,
      regionalTable: prev.regionalTable?.map(r => r.id === region.id ? region : r) || []
    }));
    setShowRegionModal(false);
    setEditingRegion(null);
  };

  const removeRegion = (regionId: string) => {
    setSettings(prev => ({
      ...prev,
      regionalTable: prev.regionalTable?.filter(r => r.id !== regionId) || []
    }));
  };

  // Métodos para gerenciar taxas por peso
  const addWeightRate = (rate: Omit<WeightBasedRate, 'id'>) => {
    const newRate: WeightBasedRate = {
      ...rate,
      id: Date.now().toString()
    };

    setSettings(prev => ({
      ...prev,
      weightBasedRates: [...(prev.weightBasedRates || []), newRate]
    }));
    setShowWeightModal(false);
    setEditingWeight(null);
  };

  const updateWeightRate = (rate: WeightBasedRate) => {
    setSettings(prev => ({
      ...prev,
      weightBasedRates: prev.weightBasedRates?.map(r => r.id === rate.id ? rate : r) || []
    }));
    setShowWeightModal(false);
    setEditingWeight(null);
  };

  const removeWeightRate = (rateId: string) => {
    setSettings(prev => ({
      ...prev,
      weightBasedRates: prev.weightBasedRates?.filter(r => r.id !== rateId) || []
    }));
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Configurações de Frete
        </h2>
        <p className="text-gray-600 mt-1">
          Configure como o frete será calculado para sua loja
        </p>
      </div>

      {/* Mensagens de Erro */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Corrija os seguintes erros:</h4>
          <ul className="list-disc list-inside space-y-1 text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Configurações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Habilitar/Desabilitar Frete */}
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Oferecer opções de frete</span>
          </label>
          <p className="text-sm text-gray-500">
            Quando desativado, os clientes não verão opções de frete no checkout
          </p>
        </div>

        {/* Retirada na Loja */}
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.pickupEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, pickupEnabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Oferecer retirada na loja</span>
          </label>
          {settings.pickupEnabled && (
            <Input
              placeholder="Mensagem para retirada (ex: Retire em 2 horas)"
              value={settings.pickupMessage || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, pickupMessage: e.target.value }))}
              className="text-sm"
            />
          )}
        </div>
      </div>

      {/* Frete Grátis */}
      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={!!settings.freeShippingThreshold}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              freeShippingThreshold: e.target.checked ? 100 : undefined
            }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Oferecer frete grátis</span>
        </label>
        {settings.freeShippingThreshold !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Para pedidos acima de</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  freeShippingThreshold: Number(e.target.value)
                }))}
                className="pl-8 w-32 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Método de Cálculo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Método de Cálculo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Frete Fixo */}
          <button
            onClick={() => handleCalculationMethodChange('fixed')}
            className={`p-4 border rounded-lg text-left transition-all ${settings.calculationMethod === 'fixed'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <DollarSign className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Frete Fixo</h4>
            <p className="text-sm text-gray-600 mt-1">Valor único para todo o Brasil</p>
          </button>

          {/* Tabela Regional */}
          <button
            onClick={() => handleCalculationMethodChange('regional_table')}
            className={`p-4 border rounded-lg text-left transition-all ${settings.calculationMethod === 'regional_table'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <MapPin className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Por Região</h4>
            <p className="text-sm text-gray-600 mt-1">Valores diferentes por estado/região</p>
          </button>

          {/* Baseado em Peso */}
          <button
            onClick={() => handleCalculationMethodChange('weight_based')}
            className={`p-4 border rounded-lg text-left transition-all ${settings.calculationMethod === 'weight_based'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <Weight className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Por Peso</h4>
            <p className="text-sm text-gray-600 mt-1">Valor baseado no peso total do pedido</p>
          </button>

          {/* Frete Grátis */}
          <button
            onClick={() => handleCalculationMethodChange('free')}
            className={`p-4 border rounded-lg text-left transition-all ${settings.calculationMethod === 'free'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <Truck className="w-6 h-6 text-gray-600 mb-2" />
            <h4 className="font-semibold text-gray-900">Sempre Grátis</h4>
            <p className="text-sm text-gray-600 mt-1">Frete gratuito para todos os pedidos</p>
          </button>
        </div>

        {/* Configurações Específicas por Método */}
        {settings.calculationMethod === 'fixed' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor do Frete Fixo
            </label>
            <div className="flex items-center space-x-2 max-w-xs">
              <span className="text-gray-500">R$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={settings.fixedPrice || 0}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  fixedPrice: Number(e.target.value)
                }))}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {settings.calculationMethod === 'regional_table' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">Tabela Regional</h4>
              <Button
                onClick={() => setShowRegionModal(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Região
              </Button>
            </div>

            {settings.regionalTable && settings.regionalTable.length > 0 ? (
              <div className="space-y-2">
                {settings.regionalTable.map(region => (
                  <div key={region.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">{region.name}</h5>
                      <p className="text-sm text-gray-600">
                        Estados: {region.states.join(', ')} | R$ {region.price} | {region.deliveryDays}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRegion(region);
                          setShowRegionModal(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRegion(region.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma região configurada</p>
                <Button
                  onClick={() => setShowRegionModal(true)}
                  variant="outline"
                  className="mt-2"
                >
                  Adicionar Primeira Região
                </Button>
              </div>
            )}
          </div>
        )}

        {settings.calculationMethod === 'weight_based' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900">Faixas de Peso</h4>
              <Button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Faixa
              </Button>
            </div>

            {settings.weightBasedRates && settings.weightBasedRates.length > 0 ? (
              <div className="space-y-2">
                {settings.weightBasedRates.map(rate => (
                  <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">
                        {rate.minWeight}kg - {rate.maxWeight}kg
                      </h5>
                      <p className="text-sm text-gray-600">R$ {rate.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingWeight(rate);
                          setShowWeightModal(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWeightRate(rate.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Weight className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma faixa de peso configurada</p>
                <Button
                  onClick={() => setShowWeightModal(true)}
                  variant="outline"
                  className="mt-2"
                >
                  Adicionar Primeira Faixa
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Modal para Região */}
      {showRegionModal && (
        <RegionModal
          region={editingRegion}
          onSave={editingRegion ? updateRegion : addRegion}
          onClose={() => {
            setShowRegionModal(false);
            setEditingRegion(null);
          }}
        />
      )}

      {/* Modal para Faixa de Peso */}
      {showWeightModal && (
        <WeightModal
          rate={editingWeight}
          onSave={editingWeight ? updateWeightRate : addWeightRate}
          onClose={() => {
            setShowWeightModal(false);
            setEditingWeight(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Modal para Região
function RegionModal({
  region,
  onSave,
  onClose
}: {
  region: ShippingRegion | null;
  onSave: (region: ShippingRegion) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: region?.name || '',
    states: region?.states.join(', ') || '',
    price: region?.price || 0,
    deliveryDays: region?.deliveryDays || '5-10 dias úteis'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: region?.id || Date.now().toString(),
      name: formData.name,
      states: formData.states.split(',').map(s => s.trim().toUpperCase()),
      price: formData.price,
      deliveryDays: formData.deliveryDays
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {region ? 'Editar Região' : 'Nova Região'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-sm font-medium">
            Nome da Região
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Sul e Sudeste"
            required
          />

          <label className="text-sm font-medium">
Estados (separados por vírgula)
          </label>
          <Input
            value={formData.states}
            onChange={(e) => setFormData(prev => ({ ...prev, states: e.target.value }))}
            placeholder="Ex: SP, RJ, MG, ES"
            required
          />

          <label className="text-sm font-medium">
            Preço do Frete
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
            required
          />

          <label className="text-sm font-medium">
            Prazo de Entrega
          </label>
          <Input
            value={formData.deliveryDays}
            onChange={(e) => setFormData(prev => ({ ...prev, deliveryDays: e.target.value }))}
            placeholder="Ex: 3-7 dias úteis"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {region ? 'Atualizar' : 'Adicionar'} Região
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal para Faixa de Peso
function WeightModal({
  rate,
  onSave,
  onClose
}: {
  rate: WeightBasedRate | null;
  onSave: (rate: WeightBasedRate) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    minWeight: rate?.minWeight || 0,
    maxWeight: rate?.maxWeight || 0,
    price: rate?.price || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: rate?.id || Date.now().toString(),
      minWeight: formData.minWeight,
      maxWeight: formData.maxWeight,
      price: formData.price
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {rate ? 'Editar Faixa de Peso' : 'Nova Faixa de Peso'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium">
              Peso Mínimo (kg)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={formData.minWeight}
              onChange={(e) => setFormData(prev => ({ ...prev, minWeight: Number(e.target.value) }))}
              required
            />

            <label className="text-sm font-medium">
              Peso Máximo (kg)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={formData.maxWeight}
              onChange={(e) => setFormData(prev => ({ ...prev, maxWeight: Number(e.target.value) }))}
              required
            />
          </div>

          <label className="text-sm font-medium">
            Preço do Frete
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {rate ? 'Atualizar' : 'Adicionar'} Faixa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}