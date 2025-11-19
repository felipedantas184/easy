'use client';
import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

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
    {state.discount?.applied ? (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Check className="text-green-600" size={20} />
            <div>
              <p className="font-semibold text-green-900">
                Cupom aplicado!
              </p>
              <p className="text-green-700 text-sm">
                {state.discount.couponCode} - {formatPrice(state.discount.discountAmount)} de desconto
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
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="Cupom de desconto"
            disabled={loading}
            className="flex-1 h-12"
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode.trim()}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Aplicar'
            )}
          </Button>
        </div>
      </div>
    )}

    {message && (
      <div className={`p-3 rounded-lg text-sm ${
        message.type === 'success' 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      </div>
    )}
  </div>
);
}