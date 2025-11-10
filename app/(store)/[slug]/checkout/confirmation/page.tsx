import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { notFound } from 'next/navigation';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

interface ConfirmationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmationPage({ 
  params, 
  searchParams 
}: ConfirmationPageProps) {
  const { slug } = await params;
  const { orderId } = await searchParams;
  
  if (!slug) {
    notFound();
  }

  const store = await storeServiceNew.getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  if (!orderId) {
    // Redirecionar para a loja se não tiver orderId
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
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <OrderConfirmation store={store} orderId={orderId} />
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}