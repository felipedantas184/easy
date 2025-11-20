// components/store/StoreFooter.tsx - REDESIGN COMPLETO
'use client';
import { useStore } from '@/contexts/store-context';
import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function StoreFooter() {
  const { store, loading, error } = useStore();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Controle do botão de scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <div className="w-32 h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  if (error || !store) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-red-400 text-sm font-medium">
            ⚠️ Erro ao carregar informações da loja
          </div>
        </div>
      </footer>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer
        className="bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">

            {/* Brand Section */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center space-x-3">
                {store.theme.logo ? (
                  <img
                    src={store.theme.logo}
                    alt={store.name}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    {store.name[0].toUpperCase()}
                  </div>
                )}
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {store.name}
                </h3>
              </div>

              {store.description && (
                <p className="text-gray-300 text-sm leading-relaxed">
                  {store.description}
                </p>
              )}

              {/* Social Links */}
              <div className="flex space-x-3 pt-2">
                {store.contact.instagram && (
                  <a
                    href={`https://instagram.com/${store.contact.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                    style={{
                      background: `linear-gradient(135deg, ${store.theme.primaryColor}15 0%, ${store.theme.secondaryColor}15 100%)`
                    }}
                  >
                    <Instagram size={18} className="text-gray-300 group-hover:text-white" />
                  </a>
                )}

                {store.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${store.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                    style={{
                      background: `linear-gradient(135deg, ${store.theme.primaryColor}15 0%, ${store.theme.secondaryColor}15 100%)`
                    }}
                  >
                    <MessageCircle size={18} className="text-gray-300 group-hover:text-white" />
                  </a>
                )}

                {store.contact.email && (
                  <a
                    href={`mailto:${store.contact.email}`}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-lg group"
                    style={{
                      background: `linear-gradient(135deg, ${store.theme.primaryColor}15 0%, ${store.theme.secondaryColor}15 100%)`
                    }}
                  >
                    <Mail size={18} className="text-gray-300 group-hover:text-white" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Navegação</h4>
              <div className="space-y-2 text-sm">
                <Link
                  href={`/${store.slug}`}
                  className="text-gray-300 hover:text-white transition-colors block py-1"
                >
                  Todos os Produtos
                </Link>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Promoções
                </button>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Lançamentos
                </button>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Mais Vendidos
                </button>
              </div>
            </div>

            {/* Suporte */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Suporte</h4>
              <div className="space-y-2 text-sm">
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Central de Ajuda
                </button>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Política de Entrega
                </button>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Trocas e Devoluções
                </button>
                <button className="text-gray-300 hover:text-white transition-colors block py-1 text-left">
                  Perguntas Frequentes
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Contato</h4>
              <div className="space-y-3 text-sm">
                {store.contact.email && (
                  <div className="flex items-start space-x-3">
                    <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <a
                      href={`mailto:${store.contact.email}`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {store.contact.email}
                    </a>
                  </div>
                )}

                {store.contact.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <a
                      href={`tel:${store.contact.phone}`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {store.contact.phone}
                    </a>
                  </div>
                )}

                {store.contact.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />

                    <span className="text-gray-300">
                      {`
                        ${store.contact.address.street}, ${store.contact.address.number}, ${store.contact.address.neighborhood} - ${store.contact.address.city}, ${store.contact.address.state}
                      `}
                    </span>
                  </div>
                )}

                {/* WhatsApp Direct */}
                {store.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${store.contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg mt-2"
                    style={{
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>Falar no WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} {store.name}. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Desenvolvido com ❤️ usando <strong>Easy Platform</strong>
              </p>
            </div>

            {/* Payment Methods Icons */}
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="text-xs">Métodos de pagamento:</div>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-gray-700 rounded text-xs flex items-center justify-center">💳</div>
                <div className="w-8 h-5 bg-gray-700 rounded text-xs flex items-center justify-center">📱</div>
                <div className="w-8 h-5 bg-gray-700 rounded text-xs flex items-center justify-center">PIX</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg z-50 animate-in fade-in duration-300"
          style={{
            backgroundColor: store.theme.primaryColor,
            background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
          }}
        >
          <ArrowUp size={20} />
        </Button>
      )}
    </>
  );
}