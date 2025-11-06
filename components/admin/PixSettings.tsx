'use client';
import { useState } from 'react';
import { Store, PixKey } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Check } from 'lucide-react';

interface PixSettingsProps {
  store: Store;
  onUpdate: (updates: Partial<Store>) => void;
}

export function PixSettings({ store, onUpdate }: PixSettingsProps) {
  const [pixKeys, setPixKeys] = useState<PixKey[]>(store.contact.pixKeys || []);
  const [newKey, setNewKey] = useState({
    key: '',
    type: 'email' as PixKey['type'],
    description: ''
  });
  const [editingKey, setEditingKey] = useState<PixKey | null>(null);

  const addPixKey = () => {
    if (!newKey.key.trim()) return;

    const pixKey: PixKey = {
      id: Date.now().toString(),
      key: newKey.key.trim(),
      type: newKey.type,
      description: newKey.description.trim() || undefined,
      isActive: true,
      createdAt: new Date(),
    };

    const updatedKeys = [...pixKeys, pixKey];
    setPixKeys(updatedKeys);
    updateStorePixKeys(updatedKeys);
    
    setNewKey({ key: '', type: 'email', description: '' });
  };

  const removePixKey = (keyId: string) => {
    const updatedKeys = pixKeys.filter(key => key.id !== keyId);
    setPixKeys(updatedKeys);
    updateStorePixKeys(updatedKeys);
  };

  const toggleKeyActive = (keyId: string) => {
    const updatedKeys = pixKeys.map(key =>
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    );
    setPixKeys(updatedKeys);
    updateStorePixKeys(updatedKeys);
  };

  const updateStorePixKeys = (keys: PixKey[]) => {
    onUpdate({
      contact: {
        ...store.contact,
        pixKeys: keys,
      }
    });
  };

  const updatePixSettings = (settings: Partial<Store['settings']['pixSettings']>) => {
    onUpdate({
      settings: {
        ...store.settings,
        pixSettings: {
          ...store.settings.pixSettings,
          ...settings,
        }
      }
    });
  };

  const getKeyTypeName = (type: PixKey['type']) => {
    const names = {
      email: 'E-mail',
      phone: 'Telefone',
      cpf: 'CPF',
      cnpj: 'CNPJ',
      random: 'Chave Aleatória'
    };
    return names[type];
  };

  const validatePixKey = (key: string, type: PixKey['type']) => {
    // Validações básicas para PIX
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+55[1-9]{2}9?[0-9]{8}$/,
      cpf: /^\d{11}$/,
      cnpj: /^\d{14}$/,
      random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
    };

    if (type === 'random') return true; // UUID é válido
    return patterns[type].test(key);
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais PIX */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Configurações do PIX</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="expirationTime" className="text-sm font-medium">
              Tempo de Expiração (minutos)
            </label>
            <Input
              id="expirationTime"
              type="number"
              min="1"
              max="1440"
              value={store.settings.pixSettings.expirationTime}
              onChange={(e) => updatePixSettings({ 
                expirationTime: parseInt(e.target.value) || 30 
              })}
            />
            <p className="text-xs text-gray-500">
              Tempo que o QR Code ficará válido
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Múltiplas Chaves PIX
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={store.settings.pixSettings.allowMultipleKeys}
                onChange={(e) => updatePixSettings({ 
                  allowMultipleKeys: e.target.checked 
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Permitir múltiplas chaves PIX
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gerenciar Chaves PIX */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Chaves PIX Cadastradas</h3>

        {/* Formulário de Nova Chave */}
        <div className="border rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">Adicionar Nova Chave PIX</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo da Chave</label>
              <select
                value={newKey.type}
                onChange={(e) => setNewKey(prev => ({ 
                  ...prev, 
                  type: e.target.value as PixKey['type'] 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chave PIX</label>
              <Input
                value={newKey.key}
                onChange={(e) => setNewKey(prev => ({ ...prev, key: e.target.value }))}
                placeholder={
                  newKey.type === 'email' ? 'seu@email.com' :
                  newKey.type === 'phone' ? '+5511999999999' :
                  newKey.type === 'cpf' ? '12345678901' :
                  newKey.type === 'cnpj' ? '12345678000195' :
                  'UUID da chave aleatória'
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={newKey.description}
                onChange={(e) => setNewKey(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Chave principal"
              />
            </div>
          </div>

          <Button onClick={addPixKey} disabled={!validatePixKey(newKey.key, newKey.type)}>
            <Plus size={16} className="mr-2" />
            Adicionar Chave
          </Button>

          {newKey.key && !validatePixKey(newKey.key, newKey.type) && (
            <p className="text-sm text-red-600 mt-2">
              Formato inválido para {getKeyTypeName(newKey.type)}
            </p>
          )}
        </div>

        {/* Lista de Chaves */}
        <div className="space-y-3">
          {pixKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma chave PIX cadastrada
            </div>
          ) : (
            pixKeys.map((pixKey) => (
              <div key={pixKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleKeyActive(pixKey.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        pixKey.isActive 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300'
                      }`}
                    >
                      {pixKey.isActive && <Check size={12} />}
                    </button>
                    
                    <div>
                      <p className="font-medium">{pixKey.key}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {getKeyTypeName(pixKey.type)}
                        </span>
                        {pixKey.description && (
                          <span>{pixKey.description}</span>
                        )}
                        <span className="text-xs">
                          Criada em {pixKey.createdAt.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {pixKey.isActive && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      Ativa
                    </span>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePixKey(pixKey.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informações */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Como funciona</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• As chaves PIX ativas aparecerão para os clientes no checkout</li>
            <li>• Use a descrição para identificar cada chave (ex: "Pessoal", "Empresa")</li>
            <li>• Você pode ter múltiplas chaves ativas simultaneamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}