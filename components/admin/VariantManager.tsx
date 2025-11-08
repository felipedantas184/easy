'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, Package, Info } from 'lucide-react';
import { ProductVariant, VariantOption } from '@/types';

interface VariantManagerProps {
  variants: ProductVariant[];
  hasVariants: boolean;
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, hasVariants, onChange }: VariantManagerProps) {
  const [newVariantName, setNewVariantName] = useState('');

  // Helper para formatar preço em Real
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Helper para converter string para número (tratando máscara)
  const parsePrice = (value: string): number => {
    // Remove R$, pontos e espaços, mantém apenas números e vírgula
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const addVariant = () => {
    if (!newVariantName.trim()) return;

    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: newVariantName.trim(),
      options: [{
        id: Date.now().toString() + '-opt',
        name: '',
        price: 0,
        comparePrice: undefined,
        stock: 0,
        sku: '',
        isActive: true
      }],
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
          comparePrice: undefined,
          stock: 0,
          sku: '',
          isActive: true,
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
        const filteredOptions = variant.options.filter(option => option.id !== optionId);
        // Não permitir remover a última opção se não tem variações
        if (!hasVariants && filteredOptions.length === 0) {
          return variant;
        }
        return { ...variant, options: filteredOptions };
      }
      return variant;
    });
    onChange(updatedVariants);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600', text: 'Esgotado' };
    if (stock <= 5) return { color: 'text-orange-600', text: 'Estoque baixo' };
    return { color: 'text-green-600', text: 'Em estoque' };
  };

  // PRODUTO SEM VARIAÇÕES - Interface super simplificada
  if (!hasVariants) {
    const defaultVariant = variants[0];
    const defaultOption = defaultVariant?.options[0];

    if (!defaultOption) return null;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info size={16} className="text-blue-600" />
            <p className="text-sm text-blue-700">
              Produto sem variações. Configure o preço, preço promocional e estoque abaixo.
            </p>
          </div>
        </div>

        {/* TABELA SIMPLIFICADA - UMA LINHA APENAS */}
        <div className="border rounded-lg overflow-hidden">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b text-sm font-medium text-gray-700">
            <div className="col-span-3">SKU *</div>
            <div className="col-span-2">Preço *</div>
            <div className="col-span-2">Preço Promocional</div>
            <div className="col-span-2">Estoque *</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Linha única de dados */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
            {/* SKU */}
            <div className="col-span-3">
              <Input
                value={defaultOption.sku}
                onChange={(e) => updateOption(defaultVariant.id, defaultOption.id, 'sku', e.target.value)}
                placeholder="SKU001"
                required
              />
            </div>

            {/* Preço Normal */}
            <div className="col-span-2">
              <Input
                type="text"
                value={defaultOption.price > 0 ? formatPrice(defaultOption.price) : ''}
                onChange={(e) => {
                  const price = parsePrice(e.target.value);
                  updateOption(defaultVariant.id, defaultOption.id, 'price', price);
                }}
                placeholder="R$ 0,00"
                required
              />
            </div>

            {/* Preço Promocional */}
            <div className="col-span-2">
              <Input
                type="text"
                value={defaultOption.comparePrice ? formatPrice(defaultOption.comparePrice) : ''}
                onChange={(e) => {
                  const price = parsePrice(e.target.value);
                  updateOption(defaultVariant.id, defaultOption.id, 'comparePrice', price > 0 ? price : undefined);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            {/* Estoque */}
            <div className="col-span-2">
              <Input
                type="number"
                min="0"
                value={defaultOption.stock}
                onChange={(e) => updateOption(defaultVariant.id, defaultOption.id, 'stock', parseInt(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>

            {/* Status */}
            <div className="col-span-2">
              <div className={`text-sm font-medium ${getStockStatus(defaultOption.stock).color}`}>
                {getStockStatus(defaultOption.stock).text}
              </div>
            </div>

            {/* Espaço vazio para alinhamento */}
            <div className="col-span-1"></div>
          </div>
        </div>

        {/* Resumo do Estoque */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <Package size={16} className="text-gray-600" />
          <span className="text-sm text-gray-700">
            <strong>Estoque atual:</strong> {defaultOption.stock} unidades
            {defaultOption.comparePrice && defaultOption.comparePrice > defaultOption.price && (
              <span className="text-green-600 ml-2">
                • Promoção ativa: de {formatPrice(defaultOption.comparePrice)} por {formatPrice(defaultOption.price)}
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // PRODUTO COM VARIAÇÕES - Tabela completa
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
          Adicionar Variação
        </Button>
      </div>

      {/* Lista de Variações */}
      <div className="space-y-4">
        {variants.map((variant) => (
          <div key={variant.id} className="border rounded-lg overflow-hidden">
            {/* Cabeçalho da Variação */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <div>
                <h4 className="font-semibold text-lg">{variant.name}</h4>
                <p className="text-sm text-gray-600">
                  {variant.options.length} opção{variant.options.length !== 1 ? 'es' : ''} • 
                  Estoque: {variant.options.reduce((sum, opt) => sum + opt.stock, 0)} unidades
                </p>
              </div>
              {variants.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVariant(variant.id)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>

            {/* Tabela de Opções */}
            <div className="space-y-2 p-4">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 pb-2">
                <div className="col-span-2">Opção</div>
                <div className="col-span-2">SKU *</div>
                <div className="col-span-2">Preço *</div>
                <div className="col-span-2">Preço Promocional</div>
                <div className="col-span-1">Estoque *</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1"></div>
              </div>

              {/* Linhas de opções */}
              {variant.options.map((option) => {
                const stockStatus = getStockStatus(option.stock);
                return (
                  <div key={option.id} className="grid grid-cols-12 gap-2 items-center py-2 border-t">
                    {/* Nome da Opção */}
                    <div className="col-span-2">
                      <Input
                        value={option.name}
                        onChange={(e) => updateOption(variant.id, option.id, 'name', e.target.value)}
                        placeholder="Ex: P, M, G, Azul"
                        required
                      />
                    </div>

                    {/* SKU */}
                    <div className="col-span-2">
                      <Input
                        value={option.sku}
                        onChange={(e) => updateOption(variant.id, option.id, 'sku', e.target.value)}
                        placeholder="SKU único"
                        required
                      />
                    </div>

                    {/* Preço Normal */}
                    <div className="col-span-2">
                      <Input
                        type="text"
                        value={option.price > 0 ? formatPrice(option.price) : ''}
                        onChange={(e) => {
                          const price = parsePrice(e.target.value);
                          updateOption(variant.id, option.id, 'price', price);
                        }}
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>

                    {/* Preço Promocional */}
                    <div className="col-span-2">
                      <Input
                        type="text"
                        value={option.comparePrice ? formatPrice(option.comparePrice) : ''}
                        onChange={(e) => {
                          const price = parsePrice(e.target.value);
                          updateOption(variant.id, option.id, 'comparePrice', price > 0 ? price : undefined);
                        }}
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* Estoque */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        value={option.stock}
                        onChange={(e) => updateOption(variant.id, option.id, 'stock', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className={`text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </div>
                      {option.comparePrice && option.comparePrice > option.price && (
                        <div className="text-xs text-green-600 mt-1">Promoção ativa</div>
                      )}
                    </div>

                    {/* Botão Remover */}
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(variant.id, option.id)}
                        disabled={variant.options.length === 1}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Botão Adicionar Opção */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addOption(variant.id)}
                className="w-full mt-2"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Opção à {variant.name}
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

      {/* Resumo Geral */}
      {variants.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Resumo do Estoque</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Variações</div>
              <div className="font-semibold">{variants.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Opções Totais</div>
              <div className="font-semibold">
                {variants.reduce((sum, variant) => sum + variant.options.length, 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Estoque Total</div>
              <div className="font-semibold">
                {variants.reduce((total, variant) => {
                  return total + variant.options.reduce((variantTotal, option) => {
                    return variantTotal + option.stock;
                  }, 0);
                }, 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Opções Esgotadas</div>
              <div className="font-semibold text-red-600">
                {variants.reduce((total, variant) => {
                  return total + variant.options.filter(option => option.stock === 0).length;
                }, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}