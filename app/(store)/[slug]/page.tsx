// app/(store)/[slug]/page.tsx - REDESIGN COMPLETO
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductGrid } from '@/components/store/ProductGrid';
import { notFound } from 'next/navigation';
import { Star, Shield, Truck, Clock, Zap, TrendingUp, Award, Users, ShoppingBag, MessageCircle, Lock } from 'lucide-react';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const store = await storeServiceNew.getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  // Dados simulados para gatilhos mentais
  const storeStats = {
    customers: Math.floor(Math.random() * 1000) + 500,
    rating: (Math.random() * 0.5 + 4.5).toFixed(1),
    orders: Math.floor(Math.random() * 2000) + 1000,
  };

  const features = [
    {
      icon: Truck,
      title: 'Entrega Rápida',
      description: 'Receba em até 48h na maior parte do Brasil'
    },
    {
      icon: Shield,
      title: 'Compra Segura',
      description: 'Seus dados protegidos com criptografia'
    },
    {
      icon: Clock,
      title: 'Atendimento 24/7',
      description: 'Suporte sempre disponível para você'
    },
    {
      icon: Zap,
      title: 'Pagamento Rápido',
      description: 'PIX aprovado na hora e sem complicação'
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-white"
      style={{
        '--primary-color': store.theme.primaryColor,
        '--secondary-color': store.theme.secondaryColor,
        '--background-color': store.theme.backgroundColor,
        '--text-color': store.theme.textColor,
      } as React.CSSProperties}
    >
      <StoreHeader />

      <main className="flex-1">
        {/* Hero Section Impactante */}
        <section
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${store.theme.primaryColor}15 0%, ${store.theme.secondaryColor}15 100%)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25px 25px, ${store.theme.primaryColor} 2px, transparent 0)`,
                backgroundSize: '50px 50px'
              }}
            ></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">

              {/* Badge de Destaque */}
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold text-gray-900">{storeStats.rating}</span>
                </div>
                <span className="text-sm text-gray-600">•</span>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-900">{storeStats.customers}+ clientes</span>
                </div>
              </div>

              {/* Título Principal */}
              <h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight"
              >
                {store.name}
              </h1>

              {/* Descrição */}
              {store.description && (
                <p
                  className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                >
                  {store.description}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <a
                  href="#products"
                  className="px-8 py-4 rounded-xl font-semibold text-white shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundColor: store.theme.primaryColor,
                    background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                  }}
                >
                  Ver Produtos
                </a>

                <button className="px-8 py-4 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
                  Como Comprar
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    {storeStats.orders}+
                  </div>
                  <div className="text-sm text-gray-600">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    {storeStats.customers}+
                  </div>
                  <div className="text-sm text-gray-600">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    100%
                  </div>
                  <div className="text-sm text-gray-600">Satisfação</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* Trending Products Preview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-600 uppercase tracking-wide">
                    Em Alta
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Produtos Populares
                </h2>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp size={16} />
                <span>Mais vendidos da semana</span>
              </div>
            </div>

            {/* Trending Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full mb-8">
              <Award size={16} />
              <span className="text-sm font-semibold">🔥 Destaques da Loja</span>
            </div>
          </div>
        </section>

        {/* Main Products Section */}
        <section id="products" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Coleção
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubra produtos selecionados com cuidado para você
              </p>
            </div>

            <ProductGrid storeId={store.id} />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Por que comprar conosco?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Oferecemos a melhor experiência de compra com benefícios exclusivos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:transform hover:-translate-y-2"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{
                      backgroundColor: store.theme.primaryColor + '15',
                      color: store.theme.primaryColor
                    }}
                  >
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div
              className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${store.theme.primaryColor}15 0%, ${store.theme.secondaryColor}15 100%)`
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 30px 30px, ${store.theme.primaryColor} 2px, transparent 0)`,
                    backgroundSize: '60px 60px'
                  }}
                ></div>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pronto para encontrar o ideal?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Junte-se a {storeStats.customers}+ clientes satisfeitos que já compraram conosco
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="#products"
                    className="px-8 py-4 rounded-xl font-semibold text-white shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center"
                    style={{
                      backgroundColor: store.theme.primaryColor,
                      background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                    }}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Começar a Comprar
                  </a>

                  {store.contact.whatsapp && (
                    <a
                      href={`https://wa.me/${store.contact.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 rounded-xl font-semibold border-2 border-green-500 text-green-600 hover:bg-green-50 transition-all duration-300 inline-flex items-center justify-center"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Falar no WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center space-y-2">
                <Shield className="w-8 h-8 text-green-400" />
                <div className="text-sm font-semibold">Compra 100% Segura</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Truck className="w-8 h-8 text-blue-400" />
                <div className="text-sm font-semibold">Entrega para Todo Brasil</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Lock className="w-8 h-8 text-purple-400" />
                <div className="text-sm font-semibold">Dados Protegidos</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Award className="w-8 h-8 text-yellow-400" />
                <div className="text-sm font-semibold">Qualidade Garantida</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await storeServiceNew.getStoreBySlug(slug);

  if (!store) {
    return {
      title: 'Loja Não Encontrada',
    };
  }

  return {
    title: `${store.name} - Loja Oficial`,
    description: store.description || `Compre os melhores produtos na ${store.name}. Entrega rápida, compra segura e os melhores preços.`,
    openGraph: {
      title: store.name,
      description: store.description || `Bem-vindo à ${store.name}`,
      type: 'website',
    },
  };
}