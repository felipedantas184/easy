'use client';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useStore } from '@/contexts/store-context';
import Link from 'next/link';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const { store } = useStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
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
                  const itemPrice = item.selectedVariant?.price || item.product.price;
                  const itemTotal = itemPrice * item.quantity;
                  
                  return (
                    <div key={index} className="flex space-x-3 border rounded-lg p-3">
                      {/* Product Image */}
                      <img
                        src={item.product.images?.[0] || '/images/placeholder-product.jpg'}
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
                            onClick={() => updateQuantity(
                              item.product.id, 
                              item.quantity - 1,
                              item.selectedVariant?.variantId
                            )}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </Button>
                          
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(
                              item.product.id, 
                              item.quantity + 1,
                              item.selectedVariant?.variantId
                            )}
                          >
                            <Plus size={14} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(
                              item.product.id,
                              item.selectedVariant?.variantId
                            )}
                            className="ml-auto text-red-600 hover:text-red-700"
                          >
                            <X size={14} />
                          </Button>
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
                  onClick={clearCart}
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