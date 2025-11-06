import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { ProductDetails } from '@/components/product/ProductDeatils';
import { notFound } from 'next/navigation';
import { storeService } from '@/lib/firebase/firestore';
import { productService } from '@/lib/firebase/firestore';

interface ProductPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, id } = await params;
  
  if (!slug || !id) {
    notFound();
  }

  const [store, product] = await Promise.all([
    storeService.getStoreBySlug(slug),
    productService.getProduct(id)
  ]);

  if (!store || !product) {
    notFound();
  }

  // Verificar se o produto pertence à loja
  if (product.storeId !== store.id) {
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
      <StoreHeader />
      
      <main className="flex-1 bg-white">
        <ProductDetails store={store} product={product} />
      </main>

      <StoreFooter />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  
  try {
    const [store, product] = await Promise.all([
      storeService.getStoreBySlug(slug),
      productService.getProduct(id)
    ]);

    if (!store || !product) {
      return {
        title: 'Produto Não Encontrado',
      };
    }

    return {
      title: `${product.name} - ${store.name}`,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images.length > 0 ? [product.images[0]] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Produto Não Encontrado',
    };
  }
}