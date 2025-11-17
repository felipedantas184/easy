// app/(store)/[slug]/page.tsx - VERSÃO SIMPLIFICADA
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductGrid } from '@/components/store/ProductGrid';
import { notFound } from 'next/navigation';
import { Shield, Truck, Clock, Zap, Award, Lock } from 'lucide-react';
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
        {/* Hero Section Simplificada */}
        <section className="pt-8 pb-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Bem-vindo à {store.name}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {store.description || 'Descubra produtos selecionados com qualidade e entrega rápida'}
              </p>
            </div>
          </div>
        </section>

        {/* Main Products Section - AGORA SÓ CHAMA O PRODUCTGRID */}
        <section id="products" className="py-4 bg-white">
          <div className="container mx-auto px-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group hover:transform hover:-translate-y-1"
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

        {/* Trust Badges */}
        <section className="py-12 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
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