// components/cart/CartSidebar.tsx - VERSÃO COM PREÇOS PROMOCIONAIS
'use client';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, ShoppingCart, Loader2, Tag } from 'lucide-react';
import { useStore } from '@/contexts/store-context';
import Link from 'next/link';
import { getProductPrice } from '@/lib/utils/product-helpers';
import { useState } from 'react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const { store } = useStore();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // ✅ NOVA FUNÇÃO: Obter preço atual considerando promoção
  const getCurrentPrice = (item: any) => {
    if (item.selectedVariant) {
      // ✅ CORREÇÃO: Se tem variante selecionada, verificar se há comparePrice (promocional)
      const variantOption = findVariantOption(item.product, item.selectedVariant.variantId, item.selectedVariant.optionId);
      
      if (variantOption?.comparePrice && variantOption.comparePrice < variantOption.price) {
        // ✅ COM DESCONTO: comparePrice é o preço promocional
        return {
          currentPrice: variantOption.comparePrice,
          originalPrice: variantOption.price,
          hasDiscount: true,
          discountPercentage: Math.round(((variantOption.price - variantOption.comparePrice) / variantOption.price) * 100)
        };
      } else {
        // ✅ SEM DESCONTO: usar preço normal
        return {
          currentPrice: variantOption?.price || 0,
          originalPrice: undefined,
          hasDiscount: false,
          discountPercentage: 0
        };
      }
    } else {
      // ✅ PRODUTO SEM VARIAÇÕES
      const firstVariant = item.product.variants?.[0];
      const firstOption = firstVariant?.options?.[0];
      
      if (firstOption?.comparePrice && firstOption.comparePrice < firstOption.price) {
        // ✅ COM DESCONTO
        return {
          currentPrice: firstOption.comparePrice,
          originalPrice: firstOption.price,
          hasDiscount: true,
          discountPercentage: Math.round(((firstOption.price - firstOption.comparePrice) / firstOption.price) * 100)
        };
      } else {
        // ✅ SEM DESCONTO
        return {
          currentPrice: firstOption?.price || 0,
          originalPrice: undefined,
          hasDiscount: false,
          discountPercentage: 0
        };
      }
    }
  };

  // ✅ FUNÇÃO AUXILIAR: Encontrar opção da variante
  const findVariantOption = (product: any, variantId: string, optionId: string) => {
    const variant = product.variants?.find((v: any) => v.id === variantId);
    return variant?.options?.find((opt: any) => opt.id === optionId);
  };

  // ✅ CORREÇÃO: Função para atualizar quantidade com tratamento de loading
  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
    optionId?: string
  ) => {
    const itemKey = `${productId}-${optionId || 'no-variant'}`;

    try {
      setLoadingItems(prev => new Set(prev).add(itemKey));

      const result = await updateQuantity(productId, newQuantity, optionId);

      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      alert('Erro ao atualizar quantidade');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // ✅ CORREÇÃO: Função para remover item
  const handleRemoveItem = async (productId: string, variantId?: string) => {
    const itemKey = `${productId}-${variantId || 'no-variant'}`;

    try {
      setLoadingItems(prev => new Set(prev).add(itemKey));

      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 300));
      removeItem(productId, variantId);

    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item do carrinho');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // ✅ CORREÇÃO: Função para limpar carrinho
  const handleClearCart = async () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      try {
        clearCart();
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
        alert('Erro ao limpar carrinho');
      }
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
      className="absolute inset-0 bg-black transition-opacity duration-300"
      style={{
        // No mobile: backdrop sempre visível (sidebar ocupa tela toda)
        // No desktop: backdrop só aparece quando sidebar está aberta
        opacity: isOpen ? 0.5 : 0,
      }}
      onClick={onClose}
      />
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Carrinho ({state.itemCount})
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Seu carrinho está vazio
                </h3>
                <p className="text-gray-600">
                  Adicione alguns produtos para continuar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item, index) => {
                  // ✅ CORREÇÃO: Usar a nova função para obter preços
                  const priceInfo = getCurrentPrice(item);
                  const itemTotal = priceInfo.currentPrice * item.quantity;
                  const itemKey = `${item.product.id}-${item.selectedVariant?.optionId || 'no-variant'}`;
                  const isLoading = loadingItems.has(itemKey);

                  return (
                    <div
                      key={index}
                      className={`flex space-x-3 border rounded-lg p-3 relative ${isLoading ? 'opacity-50' : ''
                        }`}
                    >
                      {/* Loading Overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg z-10">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                        </div>
                      )}

                      {/* Product Image */}
                      <img
                        src={item.product.images?.[0]?.url || '/images/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {item.product.name}
                            </h4>

                            {item.selectedVariant && (
                              <p className="text-xs text-gray-600">
                                {item.selectedVariant.optionName}
                              </p>
                            )}
                          </div>

                          {/* ✅ BADGE DE DESCONTO */}
                          {priceInfo.hasDiscount && (
                            <div
                              className="ml-2 px-2 py-1 text-xs font-bold text-white rounded flex items-center"
                              style={{ backgroundColor: store?.theme.primaryColor }}
                            >
                              <Tag size={10} className="mr-1" />
                              {priceInfo.discountPercentage}%
                            </div>
                          )}
                        </div>

                        {/* ✅ PREÇOS CORRETOS */}
                        <div className="mt-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPrice(priceInfo.currentPrice)}
                            </p>
                            
                            {/* ✅ PREÇO ORIGINAL RISCADO */}
                            {priceInfo.hasDiscount && priceInfo.originalPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatPrice(priceInfo.originalPrice)}
                              </p>
                            )}
                          </div>
                          
                          {/* ✅ ECONOMIA */}
                          {priceInfo.hasDiscount && priceInfo.originalPrice && (
                            <p className="text-xs text-green-600 font-medium">
                              Economize {formatPrice(priceInfo.originalPrice - priceInfo.currentPrice)}
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedVariant?.optionId
                            )}
                            disabled={item.quantity <= 1 || isLoading}
                            className="w-8 h-8 p-0"
                          >
                            <Minus size={14} />
                          </Button>

                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.selectedVariant?.optionId
                            )}
                            disabled={isLoading}
                            className="w-8 h-8 p-0"
                          >
                            <Plus size={14} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(
                              item.product.id,
                              item.selectedVariant?.optionId
                            )}
                            disabled={isLoading}
                            className="ml-auto text-red-600 hover:text-red-700 w-8 h-8 p-0"
                          >
                            <X size={14} />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="mt-2 text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            Total: {formatPrice(itemTotal)}
                          </p>
                          {priceInfo.hasDiscount && priceInfo.originalPrice && (
                            <p className="text-xs text-gray-500 line-through">
                              Total original: {formatPrice(priceInfo.originalPrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Discount Display */}
              {state.discount?.applied && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-700">
                      Cupom {state.discount.couponCode} aplicado
                    </span>
                    <span className="text-green-700 font-semibold">
                      - {formatPrice(state.discount.discountAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(state.total)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link href={`/${store?.slug}/checkout`} className="block" onClick={onClose}>
                  <Button
                    className="w-full"
                    size="lg"
                    style={{
                      backgroundColor: store?.theme.primaryColor,
                      borderColor: store?.theme.primaryColor,
                    }}
                  >
                    Finalizar Compra
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearCart}
                  disabled={loadingItems.size > 0}
                >
                  Limpar Carrinho
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}