'use client';
import { useState, useEffect } from 'react';
import { DiscountCoupon } from '@/types/discount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { discountService } from '@/lib/firebase/firestore';
import { Calendar, X } from 'lucide-react';

interface CouponFormProps {
  storeId: string;
  coupon?: DiscountCoupon;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CouponForm({ storeId, coupon, onSuccess, onCancel }: CouponFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'shipping',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue?.toString() || '',
        maxDiscount: coupon.maxDiscount?.toString() || '',
        usageLimit: coupon.usageLimit?.toString() || '',
        validFrom: coupon.validFrom.toISOString().split('T')[0],
        validUntil: coupon.validUntil.toISOString().split('T')[0],
        isActive: coupon.isActive,
      });
    } else {
      // Gerar código sugerido para novo cupom
      const suggestedCode = `CUPOM${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setFormData(prev => ({ ...prev, code: suggestedCode }));
    }
  }, [coupon]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    } else if (formData.code.length < 4) {
      newErrors.code = 'Código deve ter pelo menos 4 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      newErrors.discountValue = 'Valor do desconto é obrigatório';
    }

    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      newErrors.discountValue = 'Desconto percentual não pode ser maior que 100%';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'Data de início é obrigatória';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'Data de expiração é obrigatória';
    } else if (formData.validFrom && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'Data de expiração deve ser após a data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const couponData = {
        storeId,
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        isActive: formData.isActive,
        applicableCategories: [],
        excludedProducts: [],
      };

      if (coupon) {
        // Atualizar cupom existente
        await discountService.updateCoupon(coupon.id, couponData);
      } else {
        // Criar novo cupom
        await discountService.createCoupon(couponData);
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        setErrors({ code: 'Este código de cupom já existe' });
      } else {
        setErrors({ submit: 'Erro ao salvar cupom. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getDiscountPlaceholder = () => {
    switch (formData.discountType) {
      case 'percentage': return 'Ex: 10 para 10%';
      case 'fixed': return 'Ex: 25.90 para R$ 25,90';
      case 'shipping': return '0 (frete grátis)';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {coupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={20} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Código do Cupom */}
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Código do Cupom *
            </label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="EXEMPLO20"
              disabled={loading}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição *
            </label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ex: Cupom de lançamento"
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tipo de Desconto */}
          <div className="space-y-2">
            <label htmlFor="discountType" className="text-sm font-medium">
              Tipo de Desconto *
            </label>
            <select
              id="discountType"
              value={formData.discountType}
              onChange={(e) => handleChange('discountType', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="percentage">Porcentagem</option>
              <option value="fixed">Valor Fixo</option>
              <option value="shipping">Frete Grátis</option>
            </select>
          </div>

          {/* Valor do Desconto */}
          <div className="space-y-2">
            <label htmlFor="discountValue" className="text-sm font-medium">
              Valor do Desconto *
            </label>
            <Input
              id="discountValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.discountValue}
              onChange={(e) => handleChange('discountValue', e.target.value)}
              placeholder={getDiscountPlaceholder()}
              disabled={loading || formData.discountType === 'shipping'}
            />
            {errors.discountValue && (
              <p className="text-sm text-red-600">{errors.discountValue}</p>
            )}
          </div>

          {/* Limite de Uso */}
          <div className="space-y-2">
            <label htmlFor="usageLimit" className="text-sm font-medium">
              Limite de Usos (opcional)
            </label>
            <Input
              id="usageLimit"
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => handleChange('usageLimit', e.target.value)}
              placeholder="Ex: 100"
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Valor Mínimo do Pedido */}
          <div className="space-y-2">
            <label htmlFor="minOrderValue" className="text-sm font-medium">
              Valor Mínimo (opcional)
            </label>
            <Input
              id="minOrderValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrderValue}
              onChange={(e) => handleChange('minOrderValue', e.target.value)}
              placeholder="Ex: 100.00"
              disabled={loading}
            />
          </div>

          {/* Desconto Máximo */}
          {formData.discountType === 'percentage' && (
            <div className="space-y-2">
              <label htmlFor="maxDiscount" className="text-sm font-medium">
                Desconto Máximo (opcional)
              </label>
              <Input
                id="maxDiscount"
                type="number"
                step="0.01"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => handleChange('maxDiscount', e.target.value)}
                placeholder="Ex: 50.00"
                disabled={loading}
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Status do Cupom
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                disabled={loading}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Cupom ativo</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data de Início */}
          <div className="space-y-2">
            <label htmlFor="validFrom" className="text-sm font-medium">
              Data de Início *
            </label>
            <Input
              id="validFrom"
              type="date"
              value={formData.validFrom}
              onChange={(e) => handleChange('validFrom', e.target.value)}
              disabled={loading}
            />
            {errors.validFrom && (
              <p className="text-sm text-red-600">{errors.validFrom}</p>
            )}
          </div>

          {/* Data de Expiração */}
          <div className="space-y-2">
            <label htmlFor="validUntil" className="text-sm font-medium">
              Data de Expiração *
            </label>
            <Input
              id="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              disabled={loading}
            />
            {errors.validUntil && (
              <p className="text-sm text-red-600">{errors.validUntil}</p>
            )}
          </div>
        </div>

        {/* Preview do Cupom */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Preview do Cupom</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Código:</strong> {formData.code || '---'}</p>
            <p><strong>Desconto:</strong> {
              formData.discountType === 'percentage' ? `${formData.discountValue || '0'}% OFF` :
              formData.discountType === 'fixed' ? `R$ ${formData.discountValue || '0'} OFF` :
              'FRETE GRÁTIS'
            }</p>
            {formData.minOrderValue && (
              <p><strong>Valor mínimo:</strong> R$ {formData.minOrderValue}</p>
            )}
            {formData.validFrom && formData.validUntil && (
              <p><strong>Validade:</strong> {new Date(formData.validFrom).toLocaleDateString('pt-BR')} até {new Date(formData.validUntil).toLocaleDateString('pt-BR')}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{coupon ? 'Salvando...' : 'Criando...'}</span>
              </div>
            ) : (
              coupon ? 'Salvar Alterações' : 'Criar Cupom'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}