// components/store/StoreHeader.tsx - REDESIGN COMPLETO
'use client';
import { useState } from 'react';
import { useStore } from '@/contexts/store-context';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart, Menu, X, Search, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartSidebar } from '@/components/cart/CartSidebar';
import Link from 'next/link';

export function StoreHeader() {
  const { store, loading, error } = useStore();
  const { state } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (loading) {
    return (
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Navigation Skeleton */}
            <div className="hidden lg:flex items-center space-x-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            
            {/* Actions Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (error || !store) {
    return (
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="text-red-600 text-sm font-medium">
              ⚠️ Erro ao carregar loja
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header 
        className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm transition-all duration-300"
        style={{
          '--primary-color': store.theme.primaryColor,
          '--secondary-color': store.theme.secondaryColor,
        } as React.CSSProperties}
      >
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            
            {/* Logo e Nome - Lado Esquerdo */}
            <div className="flex items-center space-x-3 flex-1">
              <Link href={`/${store.slug}`} className="flex items-center space-x-3 group">
                {store.theme.logo ? (
                  <img 
                    src={store.theme.logo} 
                    alt={store.name}
                    className="h-8 w-8 object-contain transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-110"
                    style={{ 
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    {store.name[0].toUpperCase()}
                  </div>
                )}
                <span 
                  className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block"
                >
                  {store.name}
                </span>
              </Link>
            </div>

            {/* Navigation Central - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
              <Link 
                href={`/${store.slug}`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors relative group"
              >
                Produtos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all group-hover:w-full"></span>
              </Link>
              
              {store.contact.instagram && (
                <a 
                  href={`https://instagram.com/${store.contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Instagram
                </a>
              )}
              
              <button 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                Buscar
              </button>
            </nav>

            {/* Ações - Lado Direito */}
            <div className="flex items-center space-x-3 flex-1 justify-end">
              
              {/* Search Button - Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Search size={20} />
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-gray-600 hover:text-gray-900"
              >
                <Heart size={20} />
              </Button>

              {/* Account */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-gray-600 hover:text-gray-900"
              >
                <User size={20} />
              </Button>

              {/* Cart Button com Badge */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                style={{ 
                  borderColor: store.theme.primaryColor + '20',
                  color: store.theme.primaryColor,
                  background: `linear-gradient(135deg, ${store.theme.primaryColor}08 0%, ${store.theme.secondaryColor}08 100%)`
                }}
                className="relative group hover:shadow-lg transition-all duration-300 border-2"
              >
                <ShoppingCart size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Carrinho</span>
                {state.itemCount > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 w-6 h-6 text-xs font-bold rounded-full text-white flex items-center justify-center shadow-lg animate-bounce"
                    style={{ 
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    {state.itemCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col space-y-4">
                <Link 
                  href={`/${store.slug}`}
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 border-b border-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Todos os Produtos
                </Link>
                
                {store.contact.instagram && (
                  <a 
                    href={`https://instagram.com/${store.contact.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-gray-900 font-medium py-2 border-b border-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Nosso Instagram
                  </a>
                )}
                
                <button 
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 border-b border-gray-100 text-left"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Buscar Produtos
                </button>

                <div className="flex space-x-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Heart size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <User size={18} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search Overlay */}
          {isSearchOpen && (
            <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top duration-300">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center space-x-4">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="flex-1 py-2 outline-none text-lg placeholder-gray-400"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>
            </div>
          )}
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