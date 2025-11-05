import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductGrid } from '@/components/store/ProductGrid';
import { notFound } from 'next/navigation';
import { storeService } from '@/lib/firebase/firestore';

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  
  if (!slug) {
    notFound();
  }

  // ✅ VERIFICAR se a loja existe (apenas para o notFound)
  const store = await storeService.getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        '--primary-color': store.theme.primaryColor,
        '--secondary-color': store.theme.secondaryColor,
        '--background-color': store.theme.backgroundColor,
        '--text-color': store.theme.textColor,
      } as React.CSSProperties}
    >
      {/* ✅ AGORA StoreHeader e StoreFooter vão usar o contexto */}
      <StoreHeader />
      
      <main className="flex-1" style={{ backgroundColor: store.theme.backgroundColor }}>
        {/* Hero Section */}
        <section className="bg-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{ color: store.theme.textColor }}
              >
                Bem-vindo à {store.name}
              </h1>
              
              {store.description && (
                <p 
                  className="text-lg md:text-xl mb-8 leading-relaxed"
                  style={{ color: store.theme.textColor }}
                >
                  {store.description}
                </p>
              )}
              
              <div 
                className="w-24 h-1 mx-auto rounded-full"
                style={{ backgroundColor: store.theme.primaryColor }}
              ></div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 
                className="text-3xl font-bold mb-4"
                style={{ color: store.theme.textColor }}
              >
                Nossos Produtos
              </h2>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ color: store.theme.textColor }}
              >
                Confira nossa seleção especial de produtos
              </p>
            </div>

            <ProductGrid storeId={store.id} />
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await storeService.getStoreBySlug(slug);

  if (!store) {
    return {
      title: 'Loja Não Encontrada',
    };
  }

  return {
    title: store.name,
    description: store.description || `Bem-vindo à ${store.name}`,
  };
}