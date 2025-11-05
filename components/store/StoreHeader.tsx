'use client';
import { useState } from 'react';
import { useStore } from '@/contexts/store-context';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartSidebar } from '@/components/cart/CartSidebar';

export function StoreHeader() {
  const { store, loading, error } = useStore();
  const { state } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ✅ DEBUG: Verificar estado do contexto
  console.log('🔍 StoreHeader - Estado:', { loading, error, store: store?.name });

  if (loading) {
    console.log('🔄 StoreHeader: Carregando...');
    return (
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (error || !store) {
    console.log('❌ StoreHeader: Erro ou store não encontrada', { error, store });
    return (
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="text-red-600 text-sm">
              Erro ao carregar loja
            </div>
          </div>
        </div>
      </header>
    );
  }

  console.log('✅ StoreHeader: Renderizando loja', store.name);

  return (
    <>
      <header 
        className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{
          '--primary-color': store.theme.primaryColor,
          '--secondary-color': store.theme.secondaryColor,
        } as React.CSSProperties}
      >
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo e Nome */}
            <div className="flex items-center space-x-3">
              {store.theme.logo ? (
                <img 
                  src={store.theme.logo} 
                  alt={store.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: store.theme.primaryColor }}
                >
                  {store.name[0].toUpperCase()}
                </div>
              )}
              <span 
                className="text-xl font-bold"
                style={{ color: store.theme.primaryColor }}
              >
                {store.name}
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                Produtos
              </Button>
              <Button variant="ghost" size="sm">
                Sobre
              </Button>
              <Button variant="ghost" size="sm">
                Contato
              </Button>
              
              {/* Cart Button com contador */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCartOpen(true)}
                style={{ 
                  borderColor: store.theme.primaryColor,
                  color: store.theme.primaryColor 
                }}
                className="relative"
              >
                <ShoppingCart size={18} className="mr-2" />
                Carrinho
                {state.itemCount > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 w-5 h-5 text-xs rounded-full text-white flex items-center justify-center"
                    style={{ backgroundColor: store.theme.primaryColor }}
                  >
                    {state.itemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu */}
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu size={20} />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}