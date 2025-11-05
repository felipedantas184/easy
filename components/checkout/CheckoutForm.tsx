'use client';
import { useState } from 'react';
import { Store } from '@/types/store';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { orderService } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  store: Store;
}

export function CheckoutForm({ store }: CheckoutFormProps) {
  const { state, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Confirmação

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmitInformation = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Preencha os campos obrigatórios: nome, email e telefone');
      return;
    }

    setCurrentStep(2);
  };

  const handlePlaceOrder = async () => {
    if (state.items.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }

    setLoading(true);

    try {
      // ✅ ESTRUTURA CORRIGIDA dos dados do pedido
      const orderData = {
        storeId: store.id,
        customerInfo: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address?.trim() || '',
          city: customerInfo.city?.trim() || '',
          state: customerInfo.state?.trim() || '',
          zipCode: customerInfo.zipCode?.trim() || '',
        },
        items: state.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          variant: item.selectedVariant ? {
            variantId: item.selectedVariant.variantId,
            optionId: item.selectedVariant.optionId,
            optionName: item.selectedVariant.optionName,
            price: item.selectedVariant.price,
          } : undefined,
          quantity: item.quantity,
          price: item.selectedVariant?.price || item.product.price,
        })),
        status: 'pending' as const,
        paymentMethod: 'pix' as const,
        paymentStatus: 'pending' as const,
        total: state.total,
      };

      console.log('🛒 Dados do pedido a serem enviados:', orderData); // DEBUG

      const orderId = await orderService.createOrder(orderData);

      console.log('🎉 Pedido criado com sucesso! ID:', orderId);

      // Limpar carrinho
      clearCart();

      // Redirecionar para confirmação
      router.push(`/${store.slug}/checkout/confirmation?orderId=${orderId}`);

    } catch (error) {
      console.error('❌ Erro detalhado ao criar pedido:', error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛒</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Carrinho vazio
        </h3>
        <p className="text-gray-600 mb-4">
          Adicione produtos ao carrinho antes de finalizar a compra.
        </p>
        <Button
          onClick={() => router.push(`/${store.slug}`)}
          style={{ backgroundColor: store.theme.primaryColor }}
        >
          Continuar Comprando
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300'
              }`}>
              1
            </div>
            <span className="ml-2 font-medium">Informações</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300'
              }`}>
              2
            </div>
            <span className="ml-2 font-medium">Confirmação</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {currentStep === 1 ? (
            <form onSubmit={handleSubmitInformation} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nome Completo *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Telefone *
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Endereço de Entrega</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">
                      Endereço
                    </label>
                    <Input
                      id="address"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium">
                        Cidade
                      </label>
                      <Input
                        id="city"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="state" className="text-sm font-medium">
                        Estado
                      </label>
                      <Input
                        id="state"
                        name="state"
                        value={customerInfo.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="zipCode" className="text-sm font-medium">
                      CEP
                    </label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={customerInfo.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: store.theme.primaryColor }}
              >
                Continuar para Confirmação
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Confirmação do Pedido</h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Informações do Cliente</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nome:</strong> {customerInfo.name}</p>
                  <p><strong>Email:</strong> {customerInfo.email}</p>
                  <p><strong>Telefone:</strong> {customerInfo.phone}</p>
                  {customerInfo.address && (
                    <p><strong>Endereço:</strong> {customerInfo.address}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Método de Pagamento</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 font-bold">PIX</span>
                    </div>
                    <div>
                      <p className="font-medium">Pagamento via PIX</p>
                      <p className="text-sm text-gray-600">
                        Pague usando PIX e tenha aprovação rápida
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full"
                disabled={loading}
                style={{ backgroundColor: store.theme.primaryColor }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  `Finalizar Pedido - ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(state.total)}`
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="w-full"
              >
                Voltar para Informações
              </Button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}