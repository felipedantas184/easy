// app/(store)/[slug]/checkout/page.tsx - REDESIGN COMPLETO
import { StoreHeader } from '@/components/store/StoreHeader';
import { StoreFooter } from '@/components/store/StoreFooter';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { notFound } from 'next/navigation';
import { storeService } from '@/lib/firebase/firestore';
import { Shield, Lock, Truck, Clock, MessageCircle } from 'lucide-react';
import { OrderSummary } from '@/components/checkout/OrderSummary';

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
      className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white"
      style={{
        '--primary-color': store.theme.primaryColor,
        '--secondary-color': store.theme.secondaryColor,
      } as React.CSSProperties}
    >
      <StoreHeader />
      
      <main className="flex-1 py-8">
        {/* Trust Bar */}
        <div className="bg-white border-b border-gray-100 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <feature.icon size={16} className="text-green-500" />
                  <span className="hidden sm:inline">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield size={16} />
                <span>Ambiente 100% Seguro</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Finalizar Pedido
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Complete suas informações para finalizar sua compra com segurança
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <CheckoutForm store={store} />
                </div>

                {/* Security Notice */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Lock className="w-6 h-6 text-blue-600 mt-1" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Sua compra está protegida
                      </h4>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        Utilizamos criptografia de ponta a ponta para proteger suas informações. 
                        Seus dados pessoais e de pagamento estão sempre seguros conosco.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
                      <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
                    </div>
                    <OrderSummary storeId={store.id} />
                  </div>

                  {/* Support Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-green-900 mb-2">
                        Precisa de ajuda?
                      </h4>
                      <p className="text-green-800 text-sm mb-4">
                        Nossa equipe está aqui para te ajudar
                      </p>
                      {store.contact.whatsapp && (
                        <a 
                          href={`https://wa.me/${store.contact.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                        >
                          <MessageCircle size={16} />
                          <span>Falar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}