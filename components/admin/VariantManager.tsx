'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X } from 'lucide-react';
import { ProductVariant, VariantOption } from '@/types';

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [newVariantName, setNewVariantName] = useState('');

  const addVariant = () => {
    if (!newVariantName.trim()) return;

    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: newVariantName.trim(),
      options: [],
    };

    onChange([...variants, newVariant]);
    setNewVariantName('');
  };

  const removeVariant = (variantId: string) => {
    onChange(variants.filter(v => v.id !== variantId));
  };

  const addOption = (variantId: string) => {
    const updatedVariants = variants.map(variant => {
      if (variant.id === variantId) {
        const newOption: VariantOption = {
          id: Date.now().toString(),
          name: '',
          price: 0,
          stock: 0,
        };
        return {
          ...variant,
          options: [...variant.options, newOption],
        };
      }
      return variant;
    });
    onChange(updatedVariants);
  };

  const updateOption = (variantId: string, optionId: string, field: string, value: any) => {
    const updatedVariants = variants.map(variant => {
      if (variant.id === variantId) {
        return {
          ...variant,
          options: variant.options.map(option =>
            option.id === optionId ? { ...option, [field]: value } : option
          ),
        };
      }
      return variant;
    });
    onChange(updatedVariants);
  };

  const removeOption = (variantId: string, optionId: string) => {
    const updatedVariants = variants.map(variant => {
      if (variant.id === variantId) {
        return {
          ...variant,
          options: variant.options.filter(option => option.id !== optionId),
        };
      }
      return variant;
    });
    onChange(updatedVariants);
  };

  return (
    <div className="space-y-6">
      {/* Adicionar Nova Variação */}
      <div className="flex space-x-2">
        <Input
          placeholder="Nome da variação (ex: Tamanho, Cor)"
          value={newVariantName}
          onChange={(e) => setNewVariantName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={addVariant} type="button">
          <Plus size={16} className="mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Lista de Variações */}
      <div className="space-y-4">
        {variants.map((variant) => (
          <div key={variant.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">{variant.name}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeVariant(variant.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>

            {/* Opções da Variação */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                <div className="col-span-4">Nome da Opção</div>
                <div className="col-span-2">Preço</div>
                <div className="col-span-2">Estoque</div>
                <div className="col-span-3">SKU (opcional)</div>
                <div className="col-span-1"></div>
              </div>

              {variant.options.map((option) => (
                <div key={option.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Input
                      value={option.name}
                      onChange={(e) =>
                        updateOption(variant.id, option.id, 'name', e.target.value)
                      }
                      placeholder="Ex: P, M, G, Azul, Vermelho"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={option.price}
                      onChange={(e) =>
                        updateOption(variant.id, option.id, 'price', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      value={option.stock}
                      onChange={(e) =>
                        updateOption(variant.id, option.id, 'stock', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={option.sku || ''}
                      onChange={(e) =>
                        updateOption(variant.id, option.id, 'sku', e.target.value)
                      }
                      placeholder="SKU único"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(variant.id, option.id)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addOption(variant.id)}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Opção
              </Button>
            </div>
          </div>
        ))}
      </div>

      {variants.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🎨</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Nenhuma variação adicionada
          </h4>
          <p className="text-gray-600 text-sm">
            Adicione variações como tamanhos, cores, etc.
          </p>
        </div>
      )}
    </div>
  );
}