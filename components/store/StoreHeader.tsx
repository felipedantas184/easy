// components/store/StoreHeader.tsx - VERSÃO OTIMIZADA
'use client';
import { useState } from 'react';
import { useStore } from '@/contexts/store-context';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart, Menu, X, Heart, User, Store, Info, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartSidebar } from '@/components/cart/CartSidebar';
import Link from 'next/link';

export function StoreHeader() {
  const { store, loading, error } = useStore();
  const { state } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Left Side - Logo Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Right Side - Actions Skeleton */}
            <div className="flex items-center space-x-3">
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

  const mobileMenuItems = [
    {
      icon: Store,
      label: 'Todos os Produtos',
      href: `/${store.slug}`,
      onClick: () => setIsMobileMenuOpen(false)
    },
    {
      icon: Info,
      label: 'Sobre a Loja',
      href: '#about',
      onClick: () => setIsMobileMenuOpen(false)
    },
    ...(store.contact.instagram ? [{
      icon: User,
      label: 'Instagram',
      href: `https://instagram.com/${store.contact.instagram}`,
      external: true,
      onClick: () => setIsMobileMenuOpen(false)
    }] : []),
    ...(store.contact.whatsapp ? [{
      icon: Phone,
      label: 'WhatsApp',
      href: `https://wa.me/${store.contact.whatsapp.replace(/\D/g, '')}`,
      external: true,
      onClick: () => setIsMobileMenuOpen(false)
    }] : []),
    ...(store.contact.email ? [{
      icon: Mail,
      label: 'E-mail',
      href: `mailto:${store.contact.email}`,
      external: true,
      onClick: () => setIsMobileMenuOpen(false)
    }] : [])
  ];

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
            
            {/* Left Side - Mobile Menu + Logo */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle - AGORA NA ESQUERDA */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900 p-2"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>

              {/* Logo e Nome */}
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

            {/* Desktop Navigation - Central */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href={`/${store.slug}`}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors relative group"
              >
                Produtos
                <span 
                  className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ 
                    background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                  }}
                ></span>
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
              
              <Link 
                href="#about"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sobre
              </Link>
            </nav>

            {/* Right Side - Actions (Carrinho Isolado) */}
            <div className="flex items-center space-x-2">
              
              {/* Wishlist - Apenas Desktop */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex text-gray-600 hover:text-gray-900"
              >
                <Heart size={20} />
              </Button>

              {/* Account - Apenas Desktop */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex text-gray-600 hover:text-gray-900"
              >
                <User size={20} />
              </Button>

              {/* Cart Button com Badge - ISOLADO À DIREITA */}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                style={{ 
                  borderColor: store.theme.primaryColor + '20',
                  color: store.theme.primaryColor,
                  background: `linear-gradient(135deg, ${store.theme.primaryColor}08 0%, ${store.theme.secondaryColor}08 100%)`
                }}
                className="relative group hover:shadow-lg transition-all duration-300 border-2 min-w-[80px]"
              >
                <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
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
            </div>
          </div>

          {/* Mobile Menu Expandido - NOVO DESIGN */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md animate-in slide-in-from-top duration-300">
              <div className="py-4">
                {/* Menu Items */}
                <div className="space-y-1">
                  {mobileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    if (item.external) {
                      return (
                        <a
                          key={index}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-lg mx-2"
                          onClick={item.onClick}
                        >
                          <Icon size={18} className="text-gray-400" />
                          <span className="font-medium">{item.label}</span>
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-lg mx-2"
                        onClick={item.onClick}
                      >
                        <Icon size={18} className="text-gray-400" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Contact Info */}
                {(store.contact.phone || store.contact.email) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 px-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Contato</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {store.contact.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone size={14} />
                          <span>{store.contact.phone}</span>
                        </div>
                      )}
                      {store.contact.email && (
                        <div className="flex items-center space-x-2">
                          <Mail size={14} />
                          <span>{store.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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