'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, Package, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProductVariant, VariantOption } from '@/types';

interface VariantManagerProps {
  variants: ProductVariant[];
  hasVariants: boolean;
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, hasVariants, onChange }: VariantManagerProps) {
  const [newVariantName, setNewVariantName] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Helper para formatar preço em Real
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }, []);

  // Helper para converter valor formatado para centavos
  const parsePriceToCents = useCallback((formattedValue: string): number => {
    const rawValue = formattedValue.replace(/\D/g, '');
    return parseInt(rawValue, 10) || 0;
  }, []);

  // Função para validar preço promocional
  const validatePromotionalPrice = useCallback((price: number, promotionalPrice?: number): string => {
    if (promotionalPrice && promotionalPrice > 0) {
      if (promotionalPrice >= price) {
        return 'O preço promocional deve ser menor que o preço normal';
      }
      if (price <= 0) {
        return 'Defina o preço normal antes do promocional';
      }
    }
    return '';
  }, []);

  // Calcular percentual de desconto
  const calculateDiscountPercentage = useCallback((price: number, promotionalPrice?: number): number => {
    if (!promotionalPrice || promotionalPrice >= price) return 0;
    return Math.round(((price - promotionalPrice) / price) * 100);
  }, []);

  // Validar SKU único
  const validateUniqueSKU = useCallback((sku: string, currentVariantId: string, currentOptionId: string): string => {
    if (!sku.trim()) return '';

    const duplicate = variants.some(variant =>
      variant.options.some(option =>
        option.sku === sku &&
        option.id !== currentOptionId
      )
    );

    return duplicate ? 'SKU já existe em outra opção' : '';
  }, [variants]);

  const addVariant = useCallback(() => {
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
    setValidationErrors({});
  }, [newVariantName, variants, onChange]);

  const removeVariant = useCallback((variantId: string) => {
    onChange(variants.filter(v => v.id !== variantId));
    setValidationErrors({});
  }, [variants, onChange]);

  const addOption = useCallback((variantId: string) => {
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
  }, [variants, onChange]);

  const updateOption = useCallback((variantId: string, optionId: string, field: string, value: any) => {
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

    // Limpar erro de validação quando o campo é corrigido
    const errorKey = `${variantId}-${optionId}-${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [variants, onChange, validationErrors]);

  const removeOption = useCallback((variantId: string, optionId: string) => {
    const updatedVariants = variants.map(variant => {
      if (variant.id === variantId) {
        const filteredOptions = variant.options.filter(option => option.id !== optionId);
        if (!hasVariants && filteredOptions.length === 0) {
          return variant;
        }
        return { ...variant, options: filteredOptions };
      }
      return variant;
    });
    onChange(updatedVariants);
    setValidationErrors({});
  }, [variants, hasVariants, onChange]);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-50', text: 'Esgotado', icon: '🔴' };
    if (stock <= 5) return { color: 'text-orange-600', bg: 'bg-orange-50', text: 'Estoque baixo', icon: '🟠' };
    return { color: 'text-green-600', bg: 'bg-green-50', text: 'Em estoque', icon: '🟢' };
  }, []);

  // Função única para lidar com preços com validação
  const handlePriceChange = useCallback((variantId: string, optionId: string, field: 'price' | 'comparePrice', formattedValue: string) => {
    const cents = parsePriceToCents(formattedValue);
    const priceInReais = cents / 100;
    const errorKey = `${variantId}-${optionId}-${field}`;

    if (field === 'price') {
      updateOption(variantId, optionId, 'price', priceInReais);

      // Validar preço promocional em relação ao novo preço normal
      const option = variants
        .find(v => v.id === variantId)
        ?.options.find(o => o.id === optionId);

      if (option?.comparePrice) {
        const error = validatePromotionalPrice(priceInReais, option.comparePrice);
        setValidationErrors(prev => ({
          ...prev,
          [`${variantId}-${optionId}-comparePrice`]: error
        }));
      }
    } else {
      const option = variants
        .find(v => v.id === variantId)
        ?.options.find(o => o.id === optionId);

      const error = validatePromotionalPrice(option?.price || 0, priceInReais);

      if (error) {
        setValidationErrors(prev => ({ ...prev, [errorKey]: error }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
        updateOption(variantId, optionId, 'comparePrice', priceInReais > 0 ? priceInReais : undefined);
      }
    }
  }, [parsePriceToCents, updateOption, variants, validatePromotionalPrice]);

  // Componente de Badge de Desconto Unificado
  const DiscountBadge = useCallback(({ price, comparePrice }: { price: number; comparePrice?: number }) => {
    if (!comparePrice || comparePrice >= price) return null;

    const discountPercent = calculateDiscountPercentage(price, comparePrice);

    return (
      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
        <CheckCircle size={12} />
        <span>{discountPercent}% OFF</span>
      </div>
    );
  }, [calculateDiscountPercentage]);

  // Componente de Status de Estoque Unificado
  const StockStatus = useCallback(({ stock }: { stock: number }) => {
    const status = getStockStatus(stock);

    return (
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
        <span>{status.icon}</span>
        <span>{status.text}</span>
        <span>({stock})</span>
      </div>
    );
  }, [getStockStatus]);

  // PRODUTO SEM VARIAÇÕES - Interface super simplificada
  if (!hasVariants) {
    const defaultVariant = variants[0];
    const defaultOption = defaultVariant?.options[0];

    if (!defaultOption) return null;

    const priceError = validationErrors[`${defaultVariant.id}-${defaultOption.id}-price`];
    const comparePriceError = validationErrors[`${defaultVariant.id}-${defaultOption.id}-comparePrice`];
    const skuError = validateUniqueSKU(defaultOption.sku, defaultVariant.id, defaultOption.id);

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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b text-sm font-medium text-gray-700">
            <div className="md:col-span-3">SKU *</div>
            <div className="md:col-span-2">Preço *</div>
            <div className="md:col-span-2">Preço Promocional</div>
            <div className="md:col-span-2">Estoque *</div>
            <div className="md:col-span-3">Status</div>
          </div>

          {/* Linha única de dados */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 items-center">
            {/* SKU */}
            <div className="md:col-span-3 space-y-1">
              <Input
                value={defaultOption.sku}
                onChange={(e) => updateOption(defaultVariant.id, defaultOption.id, 'sku', e.target.value)}
                placeholder="SKU001"
                required
                className={skuError ? 'border-red-500' : ''}
              />
              {skuError && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{skuError}</span>
                </p>
              )}
            </div>

            {/* Preço Normal */}
            <div className="md:col-span-2 space-y-1">
              <Input
                type="text"
                value={defaultOption.price > 0 ? formatPrice(defaultOption.price) : ''}
                onChange={(e) => handlePriceChange(defaultVariant.id, defaultOption.id, 'price', e.target.value)}
                placeholder="R$ 0,00"
                required
                className={priceError ? 'border-red-500' : ''}
              />
              {priceError && (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{priceError}</span>
                </p>
              )}
            </div>

            {/* Preço Promocional */}
            <div className="md:col-span-2 space-y-1">
              <Input
                type="text"
                value={defaultOption.comparePrice ? formatPrice(defaultOption.comparePrice) : ''}
                onChange={(e) => handlePriceChange(defaultVariant.id, defaultOption.id, 'comparePrice', e.target.value)}
                placeholder="R$ 0,00"
                className={comparePriceError ? 'border-red-500' : ''}
              />
              {comparePriceError ? (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{comparePriceError}</span>
                </p>
              ) :
                (<></>
                )}
            </div>

            {/* Estoque */}
            <div className="md:col-span-2">
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
            <div className="md:col-span-3">
              <StockStatus stock={defaultOption.stock} />
            </div>
          </div>
        </div>

        {/* Resumo do Estoque */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Package size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">
              <strong>Estoque atual:</strong> {defaultOption.stock} unidades
            </span>
          </div>

          {defaultOption.comparePrice && defaultOption.comparePrice < defaultOption.price && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(defaultOption.price)}
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(defaultOption.comparePrice)}
              </span>
              <DiscountBadge price={defaultOption.comparePrice} comparePrice={defaultOption.price} />
            </div>
          )}
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
        {variants.map((variant, variantIndex) => (
          <div key={variant.id} className="border rounded-lg overflow-hidden">
            {/* Cabeçalho da Variação - EDITÁVEL */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Input
                    value={variant.name}
                    onChange={(e) => {
                      const updatedVariants = variants.map((v, index) =>
                        index === variantIndex
                          ? { ...v, name: e.target.value }
                          : v
                      );
                      onChange(updatedVariants);
                    }}
                    placeholder="Nome da variação"
                    className="text-lg font-semibold border-none bg-transparent p-0 focus:bg-white focus:border focus:px-2 focus:py-1 transition-all"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
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
            <div className="space-y-4 p-4">
              {/* Cabeçalho da tabela - Responsivo */}
              <div className="hidden md:grid md:grid-cols-12 gap-2 text-sm font-medium text-gray-700 pb-2">
                <div className="md:col-span-2">Opção</div>
                <div className="md:col-span-2">SKU *</div>
                <div className="md:col-span-2">Preço *</div>
                <div className="md:col-span-2">Preço Promocional</div>
                <div className="md:col-span-1">Estoque *</div>
                <div className="md:col-span-2">Status</div>
                <div className="md:col-span-1">Ação</div>
              </div>

              {/* Linhas de opções */}
              {variant.options.map((option) => {
                const priceError = validationErrors[`${variant.id}-${option.id}-price`];
                const comparePriceError = validationErrors[`${variant.id}-${option.id}-comparePrice`];
                const skuError = validateUniqueSKU(option.sku, variant.id, option.id);
                const stockStatus = getStockStatus(option.stock);

                return (
                  <div key={option.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start py-4 border-t first:border-t-0">
                    {/* Nome da Opção */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="md:hidden text-xs font-medium text-gray-500">Opção</label>
                      <Input
                        value={option.name}
                        onChange={(e) => updateOption(variant.id, option.id, 'name', e.target.value)}
                        placeholder="Ex: P, M, G, Azul"
                        required
                      />
                    </div>

                    {/* SKU */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="md:hidden text-xs font-medium text-gray-500">SKU *</label>
                      <Input
                        value={option.sku}
                        onChange={(e) => updateOption(variant.id, option.id, 'sku', e.target.value)}
                        placeholder="SKU único"
                        required
                        className={skuError ? 'border-red-500' : ''}
                      />
                      {skuError && (
                        <p className="text-red-500 text-xs flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>{skuError}</span>
                        </p>
                      )}
                    </div>

                    {/* Preço Normal */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="md:hidden text-xs font-medium text-gray-500">Preço *</label>
                      <Input
                        type="text"
                        value={option.price > 0 ? formatPrice(option.price) : ''}
                        onChange={(e) => handlePriceChange(variant.id, option.id, 'price', e.target.value)}
                        placeholder="R$ 0,00"
                        required
                        className={priceError ? 'border-red-500' : ''}
                      />
                      {priceError && (
                        <p className="text-red-500 text-xs flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>{priceError}</span>
                        </p>
                      )}
                    </div>

                    {/* Preço Promocional */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="md:hidden text-xs font-medium text-gray-500">Preço Promocional</label>
                      <Input
                        type="text"
                        value={option.comparePrice ? formatPrice(option.comparePrice) : ''}
                        onChange={(e) => handlePriceChange(variant.id, option.id, 'comparePrice', e.target.value)}
                        placeholder="R$ 0,00"
                        className={comparePriceError ? 'border-red-500' : ''}
                      />
                      {comparePriceError ? (
                        <p className="text-red-500 text-xs flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>{comparePriceError}</span>
                        </p>
                      ) : option.comparePrice && option.comparePrice < option.price && (
                        <DiscountBadge price={option.price} comparePrice={option.comparePrice} />
                      )}
                    </div>

                    {/* Estoque */}
                    <div className="md:col-span-1 space-y-1">
                      <label className="md:hidden text-xs font-medium text-gray-500">Estoque *</label>
                      <Input
                        type="number"
                        min="0"
                        value={option.stock}
                        onChange={(e) => updateOption(variant.id, option.id, 'stock', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="md:hidden text-xs font-medium text-gray-500">Status</label>
                      <StockStatus stock={option.stock} />
                      {option.comparePrice && option.comparePrice < option.price && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <span className="line-through">{formatPrice(option.price)}</span>
                          <span>→</span>
                          <span className="font-bold">{formatPrice(option.comparePrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* Botão Remover */}
                    <div className="md:col-span-1 flex md:absolute md:relative md:col-span-1">
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
                className="w-full mt-4"
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