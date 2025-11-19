// components/checkout/CheckoutForm.tsx - VERSÃO FINAL
'use client';
import { useEffect, useState } from 'react';
import { ShippingOption, Store } from '@/types/store';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { getProductPrice } from '@/lib/utils/product-helpers';
import {
  User, Mail, Phone, MapPin, Home, Map, CreditCard,
  CheckCircle, ArrowLeft, Lock, Shield, Truck, Zap, Loader2,
  ShoppingCart,
  Check
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/helpers';

interface CheckoutFormProps {
  store: Store;
}

export function CheckoutForm({ store }: CheckoutFormProps) {
  const {
    state,
    clearCart,
    getFinalTotal,
    createOrder,
    calculateShipping,
    selectShipping,
    getShippingOptions,
    getSelectedShipping,
    getTotalWithShipping,
    validateOrderData,
    getCartBreakdown
  } = useCart();

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string>('');

  // ✅ OBTER opções de frete do contexto (já calculadas)
  const shippingOptions = getShippingOptions();
  const selectedShipping = getSelectedShipping();

  // ✅ CALCULAR FRETE automaticamente quando estado for preenchido
  useEffect(() => {
    const calculateShippingIfNeeded = async () => {
      if (customerInfo.state && customerInfo.state.length === 2 && store.settings.shippingSettings?.enabled) {
        setCalculatingShipping(true);
        setShippingError('');

        try {
          const options = await calculateShipping(customerInfo.state);

          if (options.length === 0) {
            setShippingError('Nenhuma opção de frete disponível para este estado');
          }
        } catch (error) {
          console.error('Erro ao calcular frete:', error);
          setShippingError('Erro ao calcular frete. Tente novamente.');
        } finally {
          setCalculatingShipping(false);
        }
      }
    };

    calculateShippingIfNeeded();
  }, [customerInfo.state, store.settings.shippingSettings?.enabled, calculateShipping]);

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!customerInfo.name.trim()) {
      errors.name = 'Nome completo é obrigatório';
    }

    if (!customerInfo.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Email inválido';
    }

    if (!customerInfo.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else if (customerInfo.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Telefone inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleShippingChange = (option: ShippingOption) => {
    selectShipping(option);
  };

  const handleSubmitInformation = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    if (state.items.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }

    // ✅ VALIDAÇÃO COMPLETA
    const validation = validateOrderData(customerInfo, store);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      // ✅ CALCULAR BREAKDOWN DETALHADO
      const breakdown = getCartBreakdown();
      const selectedShipping = getSelectedShipping();

      // ✅ CORREÇÃO: Sempre incluir variant, mesmo quando selectedVariant é undefined
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
        items: state.items.map(item => {
          // ✅ SEMPRE determinar qual variant/option está sendo usada
          let variantInfo = null;
          let itemPrice = 0;

          if (item.selectedVariant) {
            // Caso 1: Tem selectedVariant explícito
            variantInfo = {
              variantId: item.selectedVariant.variantId,
              optionId: item.selectedVariant.optionId,
              optionName: item.selectedVariant.optionName,
              price: item.selectedVariant.price,
            };
            itemPrice = item.selectedVariant.price;
          } else {
            // Caso 2: Não tem selectedVariant, usar primeira opção
            const firstVariant = item.product.variants?.[0];
            const firstOption = firstVariant?.options?.[0];

            if (firstVariant && firstOption) {
              variantInfo = {
                variantId: firstVariant.id,
                optionId: firstOption.id,
                optionName: firstOption.name,
                price: firstOption.price,
              };
              itemPrice = firstOption.price;
            } else {
              // Fallback: usar preço do produto
              itemPrice = getProductPrice(item.product);
            }
          }

          return {
            productId: item.product.id,
            productName: item.product.name,
            variant: variantInfo, // ✅ SEMPRE definido
            quantity: item.quantity,
            price: itemPrice,
            total: itemPrice * item.quantity,
          };
        }),
        shipping: selectedShipping ? {
          method: selectedShipping.name,
          cost: selectedShipping.price,
          option: selectedShipping,
          estimatedDelivery: selectedShipping.deliveryDays,
          address: {
            street: customerInfo.address || '',
            city: customerInfo.city || '',
            state: customerInfo.state || '',
            zipCode: customerInfo.zipCode || '',
          }
        } : undefined,
        discount: state.discount?.applied ? {
          couponCode: state.discount.couponCode,
          discountAmount: state.discount.discountAmount,
          discountType: state.discount.discountType,
          originalTotal: breakdown.subtotal + (selectedShipping?.price || 0),
          finalTotal: breakdown.total,
        } : undefined,
        breakdown: {
          subtotal: breakdown.subtotal,
          shippingCost: breakdown.shippingCost,
          discountAmount: breakdown.discountAmount,
          total: breakdown.total,
        }
      };

      console.log('📦 Dados do pedido (com variant sempre definido):', orderData);

      const result = await createOrder(orderData);

      if (result.success && result.orderId) {
        clearCart();
        router.push(`/${store.slug}/checkout/confirmation?orderId=${result.orderId}`);
      } else {
        alert(result.message || 'Erro ao processar pedido');
      }

    } catch (error) {
      console.error('❌ Erro ao processar pedido:', error);

      if (error instanceof Error) {
        console.error('Mensagem de erro:', error.message);
        console.error('Stack trace:', error.stack);
      }

      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (state.items.length === 0) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingCart size={24} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Carrinho vazio
      </h3>
      <p className="text-gray-600 mb-6">
        Adicione produtos para finalizar sua compra
      </p>
      <Button
        onClick={() => router.push(`/${store.slug}`)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
      >
        Continuar Comprando
      </Button>
    </div>
  );
}

const steps = [
  { number: 1, title: 'Dados', icon: User },
  { number: 2, title: 'Pagamento', icon: CreditCard },
];

return (
  <div className="p-6">
    {/* ✅ PROGRESS STEPS SIMPLIFICADO */}
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex flex-col items-center ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 bg-white'
              }`}>
                {currentStep > step.number ? (
                  <Check size={16} />
                ) : (
                  <step.icon size={16} />
                )}
              </div>
              <span className="text-xs font-medium mt-1">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-8">
      {currentStep === 1 ? (
        <form onSubmit={handleSubmitInformation} id='checkout-main-cta' className="space-y-6">
          {/* ✅ CONTACT SECTION */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Informações de Contato</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ SHIPPING SECTION */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço Completo
                </label>
                <Input
                  id="address"
                  name="address"
                  value={customerInfo.address}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Rua, número, bairro, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={customerInfo.city}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Sua cidade"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <Input
                    id="state"
                    name="state"
                    value={customerInfo.state}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="SP"
                    maxLength={2}
                    required={store.settings.shippingSettings?.enabled}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={customerInfo.zipCode}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ SHIPPING OPTIONS */}
          {store.settings.shippingSettings?.enabled && customerInfo.state && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Opções de Entrega</h3>
              
              {calculatingShipping ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Calculando fretes...</span>
                </div>
              ) : shippingError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-700">{shippingError}</p>
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping?.id === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleShippingChange(option)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedShipping?.id === option.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedShipping?.id === option.id && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          <p className="text-gray-600 text-sm">{option.deliveryDays}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {option.price === 0 ? 'Grátis' : `R$ ${option.price.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* ✅ CTA PRINCIPAL */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-lg transition-colors"
          >
            Continuar para Pagamento
          </Button>
        </form>
      ) : (
        // ✅ STEP 2 - PAGAMENTO
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Resumo do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Itens ({state.items.length})</span>
                <span>AQUI</span>
              </div>
              {selectedShipping && (
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{selectedShipping.price === 0 ? 'Grátis' : formatPrice(selectedShipping.price)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>AQUI</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pagamento com PIX</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">PIX Instantâneo</p>
                  <p className="text-blue-700 text-sm">Aprovação imediata + Segurança</p>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ FINAL CTA OTIMIZADO */}
          <div className="space-y-3">
            <Button
              onClick={handlePlaceOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-lg transition-colors shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Lock size={20} />
                  <span>Finalizar Compra com PIX</span>
                </div>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="w-full py-3 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar para Informações
            </Button>
          </div>
        </div>
      )}
    </div>
  </div>
);
}