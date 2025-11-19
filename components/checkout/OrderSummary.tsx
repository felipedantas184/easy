// components/checkout/OrderSummary.tsx - VERSÃO FINAL CORRIGIDA
'use client';
import { useCart } from '@/contexts/cart-context';
import { DiscountCoupon } from '@/components/cart/DiscountCoupon';
import { ShippingOption } from '@/types/store';
import { Package, Tag } from 'lucide-react';
import { Button } from '../ui';

interface OrderSummaryProps {
  storeId: string;
}

export function OrderSummary({ storeId }: OrderSummaryProps) {
  const {
    state,
    getCartBreakdown,
    getShippingOptions,
    getSelectedShipping,
    selectShipping
  } = useCart();

  const shippingOptions = getShippingOptions();
  const selectedShipping = getSelectedShipping();
  const breakdown = getCartBreakdown();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // ✅ FUNÇÃO CORRIGIDA: Preços na ordem correta
  const getPriceInfo = (item: any) => {
    let option = null;

    // Se o item tem uma variação selecionada
    if (item.selectedVariant) {
      // Procura a variação pelo ID
      const variant = item.product.variants?.find((v: any) => v.id === item.selectedVariant.variantId);
      if (variant) {
        // Procura a opção pelo ID
        option = variant.options?.find((opt: any) => opt.id === item.selectedVariant.optionId);
      }
    }
    
    // Se não encontrou opção, usa a primeira opção disponível
    if (!option) {
      const firstVariant = item.product.variants?.[0];
      if (firstVariant) {
        option = firstVariant.options?.[0];
      }
    }
    
    if (option) {
      // ✅ CORREÇÃO: comparePrice é o preço PROMOCIONAL (atual)
      // price é o preço ORIGINAL (cheio)
      const hasDiscount = option.comparePrice && option.comparePrice < option.price;
      const discountPercentage = hasDiscount 
        ? Math.round(((option.price - option.comparePrice) / option.price) * 100)
        : 0;
        
      return {
        // Preço atual (promocional) = comparePrice
        currentPrice: option.comparePrice || option.price,
        // Preço original (cheio) = price
        originalPrice: hasDiscount ? option.price : undefined,
        hasDiscount,
        discountPercentage
      };
    }
    
    // Fallback
    return {
      currentPrice: 0,
      originalPrice: undefined,
      hasDiscount: false,
      discountPercentage: 0
    };
  };

  // ✅ CALCULAR ECONOMIA NOS ITENS
  const calculateItemSavings = () => {
    return state.items.reduce((savings, item) => {
      const priceInfo = getPriceInfo(item);
      if (priceInfo.hasDiscount && priceInfo.originalPrice) {
        const itemSaving = (priceInfo.originalPrice - priceInfo.currentPrice) * item.quantity;
        return savings + itemSaving;
      }
      return savings;
    }, 0);
  };

  const itemSavings = calculateItemSavings();
  const shippingAmount = selectedShipping?.price || 0;

  // ✅ CALCULAR SUBTOTAL COM PREÇOS ORIGINAIS
  const calculateOriginalSubtotal = () => {
    return state.items.reduce((total, item) => {
      const priceInfo = getPriceInfo(item);
      // Se tem desconto, usa o preço original (price), senão usa o preço atual
      const originalPrice = priceInfo.hasDiscount ? priceInfo.originalPrice! : priceInfo.currentPrice;
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  const originalSubtotal = calculateOriginalSubtotal();

  const handleShippingChange = (option: ShippingOption) => {
    selectShipping(option);
  };

  return (
  <div className="bg-white">
    {/* ✅ HEADER FIXO VISÍVEL */}
    <div className="border-b border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Seu Pedido</h3>
        <div className="flex items-center space-x-1 text-gray-500">
          <Package size={16} />
          <span className="text-sm">{state.items.length} itens</span>
        </div>
      </div>
    </div>

    <div className="p-4 space-y-4 overflow-y-auto">
      {/* ✅ CUPOM DE DESCONTO */}
      <div>
        <DiscountCoupon storeId={storeId} />
      </div>

      {/* ✅ ITENS DO PEDIDO */}
      <div className="space-y-3">
        {state.items.map((item, index) => {
          const priceInfo = getPriceInfo(item);
          const itemTotal = priceInfo.currentPrice * item.quantity;

          return (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.product.name}
                </p>
                {item.selectedVariant && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {item.selectedVariant.optionName}
                  </p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(priceInfo.currentPrice)}
                    </span>
                    {priceInfo.hasDiscount && priceInfo.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(priceInfo.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">Qtd: {item.quantity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ TOTAIS CLAROS */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(originalSubtotal)}</span>
        </div>

        {itemSavings > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Economia nos produtos</span>
            <span>- {formatPrice(itemSavings)}</span>
          </div>
        )}

        {breakdown.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto</span>
            <span>- {formatPrice(breakdown.discountAmount)}</span>
          </div>
        )}

        {selectedShipping && (
          <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span className={selectedShipping.price === 0 ? 'text-green-600 font-semibold' : ''}>
              {selectedShipping.price === 0 ? 'Grátis' : formatPrice(selectedShipping.price)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <div className="text-right">
              {(itemSavings > 0 || breakdown.discountAmount > 0) && (
                <p className="text-xs text-gray-500 line-through mb-1">
                  {formatPrice(originalSubtotal + shippingAmount)}
                </p>
              )}
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(breakdown.total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ✅ CTA FIXO NO MOBILE - Conversão máxima */}
    <div className="lg:hidden border-t border-gray-200 p-4 bg-white sticky bottom-0">
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold rounded-lg"
        onClick={() => {
          // Lógica do botão principal mantida
          document.getElementById('checkout-main-cta')?.scrollIntoView();
        }}
      >
        Finalizar Compra - {formatPrice(breakdown.total)}
      </Button>
    </div>
  </div>
);
}