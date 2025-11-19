// app/(store)/[slug]/checkout/page.tsx - REDESIGN COMPLETO
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { notFound } from 'next/navigation';
import { Shield, Lock, Truck, Clock, MessageCircle, ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { storeServiceNew } from '@/lib/firebase/store-service-new';

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  
  if (!slug) {
    notFound();
  }

  const store = await storeServiceNew.getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const trustFeatures = [
    {
      icon: Shield,
      title: 'Compra 100% Segura',
      description: 'Seus dados protegidos'
    },
    {
      icon: Lock,
      title: 'Pagamento Criptografado',
      description: 'Transação segura'
    },
    {
      icon: Truck,
      title: 'Entrega Rápida',
      description: 'Receba em até 48h'
    },
    {
      icon: Clock,
      title: 'Suporte 24/7',
      description: 'Ajuda quando precisar'
    }
  ];

  return (
  <div 
    className="min-h-screen bg-white"
    style={{
      '--primary-color': store.theme.primaryColor,
      '--secondary-color': store.theme.secondaryColor,
    } as React.CSSProperties}
  >
    {/* ✅ HEADER SIMPLIFICADO - Sem duplicação */}
    <div className="border-b border-gray-100 bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-900">Finalizar Compra</span>
          </div>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock size={16} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>

    <main className="container mx-auto px-4 py-6">
      {/* ✅ TRUST BADGES OTIMIZADOS */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Compra Segura</span>
          </div>
          <div className="flex items-center space-x-1">
            <Smartphone size={14} className="text-blue-500" />
            <span>Site Protegido</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock size={14} className="text-purple-500" />
            <span>Rápido</span>
          </div>
        </div>
      </div>

      {/* ✅ LAYOUT MOBILE-FIRST REVOLUCIONÁRIO */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* MAIN CONTENT - Foco no formulário */}
        <div className="flex-1 lg:max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CheckoutForm store={store} />
          </div>

          {/* ✅ SECURITY BADGE DISCRETO */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Lock size={12} />
            <span>Pagamento 100% seguro criptografado</span>
          </div>
        </div>

        {/* ✅ SIDEBAR STICKY OTIMIZADA - Conversão máxima */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <OrderSummary storeId={store.id} />
            </div>

            {/* ✅ SUPPORT CARD CONVERSIVO */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">
                  Precisa de ajuda?
                </h4>
                <p className="text-blue-700 text-xs mb-3">
                  Atendimento rápido via WhatsApp
                </p>
                {store.contact.whatsapp && (
                  <a 
                    href={`https://wa.me/${store.contact.whatsapp}?text=Olá! Preciso de ajuda com minha compra`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-medium text-sm transition-colors"
                  >
                    <MessageCircle size={14} className="mr-2" />
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);
}