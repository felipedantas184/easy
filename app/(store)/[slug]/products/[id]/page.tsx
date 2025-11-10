// app/(store)/[slug]/products/[id]/page.tsx - CORREÇÃO
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductDetails } from '@/components/product/ProductDeatils';
import { notFound } from 'next/navigation';
import { productServiceNew, storeServiceNew } from '@/lib/firebase/firestore-new';

interface ProductPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, id } = await params;

  if (!slug || !id) {
    notFound();
  }

  // ✅ CORREÇÃO: Buscar store primeiro, depois product
  const store = await storeServiceNew.getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const product = await productServiceNew.getProduct(store.id, id);

  if (!product || product.storeId !== store.id) {
    notFound();
  }

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
        <ProductDetails store={store} product={product} />

        {/* Product Social Proof Section */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                O que nossos clientes dizem
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Review 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    "Produto excelente! Superou minhas expectativas. Entrega rápida e atendimento impecável."
                  </p>
                  <div className="text-sm font-semibold text-gray-900">- Maria S.</div>
                </div>

                {/* Review 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    "Qualidade impressionante! Já recomendei para todos os meus amigos. Vale cada centavo."
                  </p>
                  <div className="text-sm font-semibold text-gray-900">- João P.</div>
                </div>

                {/* Review 3 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    "Compra 100% segura e produto chegou antes do prazo. Com certeza vou comprar novamente!"
                  </p>
                  <div className="text-sm font-semibold text-gray-900">- Ana L.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;

  try {
    // ✅ CORREÇÃO: Buscar store primeiro, depois product
    const store = await storeServiceNew.getStoreBySlug(slug);
    
    if (!store) {
      return {
        title: 'Produto Não Encontrado',
      };
    }

    const product = await productServiceNew.getProduct(store.id, id);

    if (!product) {
      return {
        title: 'Produto Não Encontrado',
      };
    }

    const mainImage = product.images.length > 0 ? product.images[0].url : null;

    return {
      title: `${product.name} - ${store.name}`,
      description: product.description || `Confira ${product.name} na ${store.name}. Qualidade garantida e entrega rápida.`,
      openGraph: {
        title: product.name,
        description: product.description || `Produto disponível na ${store.name}`,
        images: mainImage ? [
          {
            url: mainImage,
            width: 800,
            height: 600,
            alt: product.name,
          }
        ] : [],
        url: `${process.env.NEXT_PUBLIC_APP_URL}/${store.slug}/products/${product.id}`,
        siteName: store.name,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || `Produto disponível na ${store.name}`,
        images: mainImage ? [mainImage] : [],
      },
      keywords: `${product.name}, ${product.category}, ${store.name}, comprar online`,
      robots: 'index, follow',
    };
  } catch (error) {
    return {
      title: 'Produto Não Encontrado',
    };
  }
}