import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { notFound, redirect } from 'next/navigation';
import { storeService } from '@/lib/firebase/firestore';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  
  if (!slug) {
    notFound();
  }

  const store = await storeService.getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  // Em uma implementação real, verificar se o carrinho tem itens
  // if (cartItems.length === 0) {
  //   redirect(`/${slug}`);
  // }

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
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
              <p className="text-gray-600 mt-2">
                Complete suas informações para finalizar a compra
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <CheckoutForm store={store} />
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}