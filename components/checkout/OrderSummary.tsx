// components/checkout/OrderSummary.tsx - VERSÃO FINAL CORRIGIDA
'use client';
import { useCart } from '@/contexts/cart-context';
import { DiscountCoupon } from '@/components/cart/DiscountCoupon';
import { ShippingOption } from '@/types/store';
import { Tag } from 'lucide-react';

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
    <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

      {/* Cupom de Desconto */}
      <div className="mb-4">
        <DiscountCoupon storeId={storeId} />
      </div>

      {/* Opções de Frete */}
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

      {/* ✅ ITENS DO CARRINHO - PREÇOS CORRETOS */}
      <div className="space-y-3 mb-4">
        {state.items.map((item, index) => {
          const priceInfo = getPriceInfo(item);
          const itemTotal = priceInfo.currentPrice * item.quantity;
          const itemSavings = priceInfo.hasDiscount && priceInfo.originalPrice 
            ? (priceInfo.originalPrice - priceInfo.currentPrice) * item.quantity
            : 0;

          return (
            <div key={index} className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    {item.selectedVariant && (
                      <p className="text-xs text-gray-600">
                        {item.selectedVariant.optionName}
                      </p>
                    )}
                  </div>
                  
                  {/* ✅ BADGE DE DESCONTO */}
                  {priceInfo.hasDiscount && priceInfo.discountPercentage > 0 && (
                    <div className="ml-2 px-2 py-1 text-xs font-bold text-white rounded flex items-center bg-green-500">
                      <Tag size={10} className="mr-1" />
                      {priceInfo.discountPercentage}%
                    </div>
                  )}
                </div>

                {/* ✅ PREÇOS CORRETOS: */}
                {/* Preço atual (promocional) SEM riscar */}
                {/* Preço original (cheio) COM riscado */}
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500">
                    {formatPrice(priceInfo.currentPrice)} × {item.quantity}
                  </p>
                  
                  {priceInfo.hasDiscount && priceInfo.originalPrice && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(priceInfo.originalPrice)} × {item.quantity}
                    </p>
                  )}
                </div>
                
                {/* ✅ ECONOMIA POR ITEM */}
                {priceInfo.hasDiscount && priceInfo.originalPrice && itemSavings > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Economizou {formatPrice(itemSavings)}
                  </p>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 ml-2">
                {formatPrice(itemTotal)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ✅ TOTAIS - EXATAMENTE COMO NO CÓDIGO ANTIGO */}
      <div className="border-t pt-4 space-y-2">
        {/* Subtotal COM PREÇOS ORIGINAIS */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(originalSubtotal)}</span>
        </div>

        {/* ECONOMIA NOS PRODUTOS */}
        {itemSavings > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Economia nos produtos</span>
            <span>- {formatPrice(itemSavings)}</span>
          </div>
        )}

        {/* Desconto do Cupom */}
        {breakdown.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto ({state.discount?.couponCode})</span>
            <span>- {formatPrice(breakdown.discountAmount)}</span>
          </div>
        )}

        {/* Frete */}
        {selectedShipping && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frete ({selectedShipping.name})</span>
            <span className="text-gray-900">
              {selectedShipping.price === 0 ? 'Grátis' : formatPrice(selectedShipping.price)}
            </span>
          </div>
        )}

        {/* LINHA DIVISÓRIA E TOTAL */}
        <div className="border-t pt-2"></div>
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(breakdown.total)}</span>
        </div>

        {/* RESUMO DE ECONOMIA DETALHADO */}
        {(itemSavings > 0 || breakdown.discountAmount > 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  🎉 Você economizou {formatPrice(itemSavings + breakdown.discountAmount)}
                </p>
                <div className="text-xs text-green-600 mt-1 space-y-1">
                  {itemSavings > 0 && (
                    <p>• {formatPrice(itemSavings)} em descontos nos produtos</p>
                  )}
                  {breakdown.discountAmount > 0 && (
                    <p>• {formatPrice(breakdown.discountAmount)} com cupom {state.discount?.couponCode}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600 line-through">
                  {formatPrice(originalSubtotal + shippingAmount)}
                </p>
                <p className="text-sm font-medium text-green-800">
                  {formatPrice(breakdown.total)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}