import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { notFound } from 'next/navigation';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { storeServiceNew } from '@/lib/firebase/store-service-new';
import { Check } from 'lucide-react';

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
      className="min-h-screen bg-gradient-to-br from-gray-25 to-white"
      style={{
        '--primary-color': store.theme.primaryColor,
        '--secondary-color': store.theme.secondaryColor,
      } as React.CSSProperties}
    >
      {/* ✅ HEADER SIMPLIFICADO - Foco na confirmação */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check size={16} className="text-green-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Pedido Confirmado</span>
            </div>
            <div className="text-xs text-gray-500">
              #{orderId}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <OrderConfirmation store={store} orderId={orderId} />
        </div>
      </main>

      {/* ✅ FOOTER MINIMALISTA */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            {store.name} • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}