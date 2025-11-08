'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Package, Truck, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface InventoryManagerProps {
  formData: any;
  onChange: (data: any) => void;
  totalStock: number;
}

export function InventoryManager({ formData, onChange, totalStock }: InventoryManagerProps) {
  const [showShipping, setShowShipping] = useState(false);

  const getStockStatus = () => {
    if (totalStock === 0) {
      return { color: 'text-red-600', text: 'Esgotado', bg: 'bg-red-50', icon: '🔴' };
    }
    if (totalStock <= 5) {
      return { color: 'text-orange-600', text: 'Estoque baixo', bg: 'bg-orange-50', icon: '🟠' };
    }
    return { color: 'text-green-600', text: 'Em estoque', bg: 'bg-green-50', icon: '🟢' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Status do Estoque */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Estoque</h3>
          <p className="text-sm text-gray-500">
            Controle e monitoramento do inventário
          </p>
        </div>

        {/* Card de Status */}
        <div className={`border rounded-lg p-4 ${stockStatus.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${stockStatus.bg.replace('50', '100')}`}>
                <Package className={`w-5 h-5 ${stockStatus.color}`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Status do Estoque</h4>
                <p className={`text-sm font-medium ${stockStatus.color}`}>
                  {stockStatus.text}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
              <div className="text-sm text-gray-600">unidades totais</div>
            </div>
          </div>

          {formData.hasVariants && (
            <div className="mt-3 p-3 bg-white rounded border">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Info size={16} />
                <span>
                  O estoque é controlado individualmente para cada opção de variação.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Envio */}
      <div className="border-t pt-6">
        <button
          type="button"
          onClick={() => setShowShipping(!showShipping)}
          className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Configurações de Envio</h3>
              <p className="text-sm text-gray-500">
                Peso e dimensões para cálculo de frete (opcional)
              </p>
            </div>
          </div>
          {showShipping ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {showShipping && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border">
            {/* Peso */}
            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">
                Peso do produto
              </label>
              <div className="flex space-x-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => onChange({ ...formData, weight: e.target.value })}
                  placeholder="0.500"
                />
                <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 min-w-[60px]">
                  kg
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Peso incluindo embalagem
              </p>
            </div>

            {/* Dimensões */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Dimensões da embalagem
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="length" className="text-xs text-gray-600">
                    Comprimento
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="length"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.length}
                      onChange={(e) => onChange({
                        ...formData,
                        dimensions: { ...formData.dimensions, length: e.target.value }
                      })}
                      placeholder="20.0"
                    />
                    <div className="flex items-center px-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-600 min-w-[40px]">
                      cm
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="width" className="text-xs text-gray-600">
                    Largura
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.width}
                      onChange={(e) => onChange({
                        ...formData,
                        dimensions: { ...formData.dimensions, width: e.target.value }
                      })}
                      placeholder="15.0"
                    />
                    <div className="flex items-center px-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-600 min-w-[40px]">
                      cm
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="height" className="text-xs text-gray-600">
                    Altura
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.dimensions.height}
                      onChange={(e) => onChange({
                        ...formData,
                        dimensions: { ...formData.dimensions, height: e.target.value }
                      })}
                      placeholder="10.0"
                    />
                    <div className="flex items-center px-2 bg-gray-100 border border-gray-300 rounded-md text-xs text-gray-600 min-w-[40px]">
                      cm
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview do Volume */}
              {(formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) && (
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium text-sm mb-1">Volume estimado:</h4>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const length = parseFloat(formData.dimensions.length) || 0;
                      const width = parseFloat(formData.dimensions.width) || 0;
                      const height = parseFloat(formData.dimensions.height) || 0;
                      const volume = length * width * height;
                      return volume > 0 ? 
                        `${volume.toFixed(1)} cm³ (${length} × ${width} × ${height} cm)` : 
                        'Preencha as dimensões';
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alertas e Recomendações */}
      <div className="space-y-3">
        {totalStock === 0 && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <strong>Produto esgotado.</strong> Os clientes não poderão comprar este produto até que o estoque seja reposto.
            </div>
          </div>
        )}

        {totalStock > 0 && totalStock <= 5 && (
          <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <strong>Estoque baixo.</strong> Restam apenas {totalStock} unidades. Considere repor o estoque.
            </div>
          </div>
        )}

        {(!formData.weight || !formData.dimensions.length) && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Configuração de frete:</strong> Adicione peso e dimensões para cálculos precisos de frete.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}