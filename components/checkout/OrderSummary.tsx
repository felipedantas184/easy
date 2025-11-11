// ATUALIZAR OrderSummary para refletir frete em tempo real
'use client';
import { useCart } from '@/contexts/cart-context';
import { DiscountCoupon } from '@/components/cart/DiscountCoupon';
import { getProductPrice } from '@/lib/utils/product-helpers';
import { ShippingOption } from '@/types/store';

interface OrderSummaryProps {
  storeId: string;
}

export function OrderSummary({ storeId }: OrderSummaryProps) {
  const { 
    state, 
    getFinalTotal, 
    getTotalWithShipping,
    getShippingOptions,
    getSelectedShipping,
    selectShipping
  } = useCart();

  const shippingOptions = getShippingOptions();
  const selectedShipping = getSelectedShipping();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const subtotal = state.total;
  const discountAmount = state.discount?.discountAmount || 0;
  const shippingAmount = selectedShipping?.price || 0;
  const finalTotal = getTotalWithShipping();

  const handleShippingChange = (option: ShippingOption) => {
    selectShipping(option);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

      {/* Cupom de Desconto */}
      <div className="mb-4">
        <DiscountCoupon storeId={storeId} />
      </div>

      {/* Opções de Frete - AGORA DINÂMICO */}
      {shippingOptions.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Entrega
          </label>
          <div className="space-y-2">
            {shippingOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedShipping?.id === option.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleShippingChange(option)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{option.name}</span>
                    <span className="font-semibold">
                      {option.price === 0 ? 'Grátis' : formatPrice(option.price)}
                    </span>
                  </div>
                  {option.description && (
                    <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {option.deliveryDays}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itens do Carrinho */}
      <div className="space-y-3 mb-4">
        {state.items.map((item, index) => {
          const itemPrice = item.selectedVariant?.price || getProductPrice(item.product);
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
          <span className="text-gray-900">{formatPrice(subtotal)}</span>
        </div>

        {/* Desconto Aplicado */}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto ({state.discount?.couponCode})</span>
            <span>- {formatPrice(discountAmount)}</span>
          </div>
        )}

        {/* Frete */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete</span>
          <span className="text-gray-900">
            {selectedShipping 
              ? (selectedShipping.price === 0 ? 'Grátis' : formatPrice(selectedShipping.price))
              : shippingOptions.length > 0 
                ? 'Selecione uma opção'
                : 'A calcular'
            }
          </span>
        </div>

        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>

        {/* Economia com Desconto */}
        {discountAmount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-green-700 text-center">
              🎉 Você economizou {formatPrice(discountAmount)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}