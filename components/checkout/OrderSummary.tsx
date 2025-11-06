'use client';
import { useCart } from '@/contexts/cart-context';
import { DiscountCoupon } from '@/components/cart/DiscountCoupon';

interface OrderSummaryProps {
  storeId: string;
}

export function OrderSummary({ storeId }: OrderSummaryProps) {
  const { state, getFinalTotal } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const finalTotal = getFinalTotal();

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
      
      {/* Cupom de Desconto */}
      <div className="mb-4">
        <DiscountCoupon storeId={storeId} />
      </div>
      
      {/* Itens do Carrinho */}
      <div className="space-y-3 mb-4">
        {state.items.map((item, index) => {
          const itemPrice = item.selectedVariant?.price || item.product.price;
          const itemTotal = itemPrice * item.quantity;
          
          return (
            <div key={index} className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product.name}
                </p>
                {item.selectedVariant && (
                  <p className="text-xs text-gray-600">
                    {item.selectedVariant.optionName}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatPrice(itemPrice)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900 ml-2">
                {formatPrice(itemTotal)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Totais */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(state.total)}</span>
        </div>
        
        {/* Desconto Aplicado */}
        {state.discount?.applied && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto ({state.discount.couponCode})</span>
            <span>- {formatPrice(state.discount.discountAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete</span>
          <span className="text-gray-900">Grátis</span>
        </div>
        
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

        {/* Economia com Desconto */}
        {state.discount?.applied && state.discount.discountAmount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-green-700 text-center">
              🎉 Você economizou {formatPrice(state.discount.discountAmount)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}