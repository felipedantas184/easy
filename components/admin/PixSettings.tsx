'use client';
import { useState } from 'react';
import { Store, PixKey } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Check, AlertCircle, Info, Smartphone, Mail, User, Building, Key } from 'lucide-react';

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
  const [errors, setErrors] = useState<{ key?: string }>({});
  const [isAdding, setIsAdding] = useState(false);

  const addPixKey = () => {
    if (!newKey.key.trim()) {
      setErrors({ key: 'Chave PIX é obrigatória' });
      return;
    }

    if (!validatePixKey(newKey.key, newKey.type)) {
      setErrors({ key: `Formato inválido para ${getKeyTypeName(newKey.type).toLowerCase()}` });
      return;
    }

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
    setErrors({});
    setIsAdding(false);
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

  const getKeyTypeIcon = (type: PixKey['type']) => {
    const icons = {
      email: Mail,
      phone: Smartphone,
      cpf: User,
      cnpj: Building,
      random: Key
    };
    return icons[type];
  };

  const validatePixKey = (key: string, type: PixKey['type']) => {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^(\+55)?\s?(\(?\d{2}\)?)?\s?9?\d{4}[-.\s]?\d{4}$/,
      cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
      cnpj: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
      random: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
    };

    if (type === 'random') return true;
    return patterns[type].test(key.replace(/\s/g, ''));
  };

  const formatKeyForDisplay = (key: string, type: PixKey['type']) => {
    if (type === 'phone') {
      return key.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (type === 'cpf') {
      return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (type === 'cnpj') {
      return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return key;
  };

  const getPlaceholder = (type: PixKey['type']) => {
    const placeholders = {
      email: 'seu@email.com',
      phone: '(11) 99999-9999',
      cpf: '123.456.789-01',
      cnpj: '12.345.678/0001-95',
      random: '123e4567-e89b-12d3-a456-426614174000'
    };
    return placeholders[type];
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais PIX */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          Configurações do PIX
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-2">
            <label htmlFor="expirationTime" className="text-sm font-medium text-gray-700">
              Tempo de Expiração
            </label>
            <div className="relative">
              <Input
                id="expirationTime"
                type="number"
                min="1"
                max="1440"
                value={store.settings.pixSettings.expirationTime}
                onChange={(e) => updatePixSettings({
                  expirationTime: parseInt(e.target.value) || 30
                })}
                className="pr-16"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">min</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tempo que o QR Code PIX ficará válido para pagamento
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">
              Configurações de Chaves
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={store.settings.pixSettings.allowMultipleKeys}
                onChange={(e) => updatePixSettings({
                  allowMultipleKeys: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">
                  Permitir múltiplas chaves PIX
                </span>
                <span className="text-xs text-gray-500">
                  Clientes poderão escolher entre diferentes chaves
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Gerenciar Chaves PIX */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            Chaves PIX Cadastradas
          </h3>

          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              className="lg:self-start"
            >
              <Plus size={16} className="mr-2" />
              Nova Chave
            </Button>
          )}
        </div>

        {/* Formulário de Nova Chave */}
        {isAdding && (
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 mb-6 bg-blue-50/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">Adicionar Nova Chave PIX</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewKey({ key: '', type: 'email', description: '' });
                  setErrors({});
                }}
              >
                Cancelar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo da Chave</label>
                  <select
                    value={newKey.type}
                    onChange={(e) => {
                      setNewKey(prev => ({
                        ...prev,
                        type: e.target.value as PixKey['type'],
                        key: '' // Limpa a chave ao mudar o tipo
                      }));
                      setErrors({});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Chave PIX</label>
                  <Input
                    value={newKey.key}
                    onChange={(e) => {
                      setNewKey(prev => ({ ...prev, key: e.target.value }));
                      setErrors({});
                    }}
                    placeholder={getPlaceholder(newKey.type)}
                    className={errors.key ? 'border-red-500' : ''}
                  />
                  {errors.key && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.key}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
                  <Input
                    value={newKey.description}
                    onChange={(e) => setNewKey(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Chave principal"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={addPixKey}
                  disabled={!newKey.key.trim()}
                  className="flex-1"
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar Chave
                </Button>

                <div className="flex-1 text-xs text-gray-500 flex items-start gap-1">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    A chave será formatada automaticamente para exibição
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Chaves */}
        <div className="space-y-3">
          {pixKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma chave PIX cadastrada</p>
              <p className="text-sm text-gray-500 mt-1">
                Adicione sua primeira chave PIX para receber pagamentos
              </p>
            </div>
          ) : (
            pixKeys.map((pixKey) => {
              const IconComponent = getKeyTypeIcon(pixKey.type);
              return (
                <div
                  key={pixKey.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-all ${pixKey.isActive
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 bg-gray-50/30'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        onClick={() => toggleKeyActive(pixKey.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0 transition-colors ${pixKey.isActive
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        {pixKey.isActive && <Check size={12} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-medium text-gray-900 text-sm lg:text-base break-all">
                            {formatKeyForDisplay(pixKey.key, pixKey.type)}
                          </p>
                          {pixKey.isActive && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Ativa
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            <IconComponent size={12} />
                            {getKeyTypeName(pixKey.type)}
                          </span>
                          {pixKey.description && (
                            <span className="text-gray-500">• {pixKey.description}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            Criada em {(
                              pixKey.createdAt instanceof Date
                                ? pixKey.createdAt
                                : pixKey.createdAt.toDate()
                            ).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePixKey(pixKey.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Informações */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Info size={16} />
            Como funciona
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start gap-2">
              <Check size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <span>Apenas chaves ativas aparecem para os clientes no checkout</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <span>Use descrições para identificar cada chave (ex: "Pessoal", "Empresa")</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={14} className="flex-shrink-0 mt-0.5 text-blue-600" />
              <span>Você pode ter múltiplas chaves ativas simultaneamente</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}