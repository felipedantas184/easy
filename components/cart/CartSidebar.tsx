'use client';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
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

  // ✅ CORREÇÃO: Função para atualizar quantidade com tratamento de loading
  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
    optionId?: string // ✅ MUDAR PARA optionId
  ) => {
    const itemKey = `${productId}-${optionId || 'no-variant'}`;

    try {
      setLoadingItems(prev => new Set(prev).add(itemKey));

      const result = await updateQuantity(productId, newQuantity, optionId); // ✅ MUDAR PARA optionId

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
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

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
                  const itemPrice = item.selectedVariant?.price || getProductPrice(item.product);
                  const itemTotal = itemPrice * item.quantity;
                  const itemKey = `${item.product.id}-${item.selectedVariant?.variantId || 'no-variant'}`;
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
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.product.name}
                        </h4>

                        {item.selectedVariant && (
                          <p className="text-xs text-gray-600">
                            {item.selectedVariant.optionName}
                          </p>
                        )}

                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(itemPrice)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedVariant?.optionId // ✅ MUDAR PARA optionId
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
                              item.selectedVariant?.optionId // ✅ MUDAR PARA optionId
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
                              item.selectedVariant?.optionId // ✅ MUDAR PARA optionId
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