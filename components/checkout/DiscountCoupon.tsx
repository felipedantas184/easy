'use client';
import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Check, AlertCircle } from 'lucide-react';

interface DiscountCouponProps {
  storeId: string;
}

export function DiscountCoupon({ storeId }: DiscountCouponProps) {
  const { state, applyDiscount, removeDiscount, getFinalTotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await applyDiscount(couponCode.toUpperCase(), storeId);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      if (result.success) {
        setCouponCode('');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao aplicar cupom',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeDiscount();
    setMessage(null);
    setCouponCode('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-3">
      {/* Cupom Aplicado */}
      {state.discount?.applied ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="text-green-600" size={20} />
              <div>
                <p className="font-medium text-green-900">
                  Cupom aplicado: {state.discount.couponCode}
                </p>
                <p className="text-sm text-green-700">
                  Desconto de R$ {state.discount.discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-700 hover:text-green-800"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        /* Input de Cupom */
        <div className="space-y-2">
          <label htmlFor="coupon-code" className="text-sm font-medium text-gray-700">
            Cupom de desconto
          </label>
          
          <div className="flex space-x-2">
            <Input
              id="coupon-code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite o código do cupom"
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              variant="outline"
            >
              <Tag size={16} className="mr-2" />
              {loading ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
        </div>
      )}

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'error' && <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}