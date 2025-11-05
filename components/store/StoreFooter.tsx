'use client';
import { useStore } from '@/contexts/store-context';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export function StoreFooter() {
  const { store, loading, error } = useStore();

  // ✅ DEBUG
  console.log('🔍 StoreFooter - Estado:', { loading, error, store: store?.name });

  if (loading) {
    console.log('🔄 StoreFooter: Carregando...');
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </footer>
    );
  }

  if (error || !store) {
    console.log('❌ StoreFooter: Erro ou store não encontrada', { error, store });
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-red-400 text-sm">
            Erro ao carregar informações da loja
          </div>
        </div>
      </footer>
    );
  }

  console.log('✅ StoreFooter: Renderizando footer para', store.name);

  return (
    <footer 
      className="bg-gray-900 text-white"
      style={{
        '--primary-color': store.theme.primaryColor,
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {store.theme.logo ? (
                <img 
                  src={store.theme.logo} 
                  alt={store.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: store.theme.primaryColor }}
                >
                  {store.name[0].toUpperCase()}
                </div>
              )}
              <h3 className="text-xl font-bold">{store.name}</h3>
            </div>
            
            {store.description && (
              <p className="text-gray-300 text-sm leading-relaxed">
                {store.description}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contato</h4>
            <div className="space-y-2 text-sm text-gray-300">
              {store.contact.email && (
                <div className="flex items-center space-x-2">
                  <Mail size={16} />
                  <span>{store.contact.email}</span>
                </div>
              )}
              
              {store.contact.phone && (
                <div className="flex items-center space-x-2">
                  <Phone size={16} />
                  <span>{store.contact.phone}</span>
                </div>
              )}
              
              {store.contact.address && (
                <div className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>{store.contact.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Redes Sociais</h4>
            <div className="flex space-x-4">
              {store.contact.instagram && (
                <a 
                  href={`https://instagram.com/${store.contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Instagram size={20} />
                </a>
              )}
              
              {store.contact.whatsapp && (
                <a 
                  href={`https://wa.me/${store.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Phone size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {store.name}. Todos os direitos reservados.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Desenvolvido com Easy Platform
          </p>
        </div>
      </div>
    </footer>
  );
}