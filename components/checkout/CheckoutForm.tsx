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
  CheckCircle, ArrowLeft, Lock, Shield, Truck, Zap, Loader2
} from 'lucide-react';

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
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🛒</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Carrinho vazio
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Adicione alguns produtos incríveis ao carrinho antes de finalizar sua compra.
        </p>
        <Button
          onClick={() => router.push(`/${store.slug}`)}
          className="px-8 py-3 text-lg font-semibold"
          style={{
            backgroundColor: store.theme.primaryColor,
            background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
          }}
        >
          Continuar Comprando
        </Button>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Informações', icon: User },
    { number: 2, title: 'Pagamento', icon: CreditCard },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-8">
          {[
            { number: 1, title: 'Informações', icon: User },
            { number: 2, title: 'Pagamento', icon: CreditCard },
          ].map((step, index) => (
            <div key={step.number} className="flex items-center space-x-4">
              <div className={`flex flex-col items-center ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'border-gray-300 bg-white'
                  }`}>
                  {currentStep > step.number ? (
                    <CheckCircle size={20} />
                  ) : (
                    <step.icon size={20} />
                  )}
                </div>
                <span className="text-sm font-medium mt-2">{step.title}</span>
              </div>
              {index < 1 && (
                <div className={`w-16 h-0.5 transition-colors duration-300 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          {currentStep === 1 ? (
            <form onSubmit={handleSubmitInformation} className="space-y-8">
              {/* Contact Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Informações de Contato</h3>
                    <p className="text-gray-600 text-sm">Como podemos entrar em contato?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <User size={16} />
                      <span>Nome Completo *</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      required
                      className={`h-12 text-lg ${formErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Seu nome completo"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Mail size={16} />
                      <span>Email *</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      required
                      className={`h-12 text-lg ${formErrors.email ? 'border-red-500' : ''}`}
                      placeholder="seu@email.com"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-sm">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Phone size={16} />
                      <span>Telefone/WhatsApp *</span>
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      required
                      className={`h-12 text-lg ${formErrors.phone ? 'border-red-500' : ''}`}
                      placeholder="(11) 99999-9999"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-sm">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Endereço de Entrega</h3>
                    <p className="text-gray-600 text-sm">Onde devemos entregar seu pedido?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                      <Home size={16} />
                      <span>Endereço Completo</span>
                    </label>
                    <Input
                      id="address"
                      name="address"
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      className="h-12 text-lg"
                      placeholder="Rua, número, bairro, complemento"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="city" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <MapPin size={16} />
                        <span>Cidade</span>
                      </label>
                      <Input
                        id="city"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                        className="h-12 text-lg"
                        placeholder="Sua cidade"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="state" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Map size={16} />
                        <span>Estado *</span>
                      </label>
                      <Input
                        id="state"
                        name="state"
                        value={customerInfo.state}
                        onChange={handleInputChange}
                        className="h-12 text-lg"
                        placeholder="SP"
                        maxLength={2}
                        required={store.settings.shippingSettings?.enabled}
                      />
                      {formErrors.state && (
                        <p className="text-red-500 text-sm">{formErrors.state}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="zipCode" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <MapPin size={16} />
                        <span>CEP</span>
                      </label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={customerInfo.zipCode}
                        onChange={handleInputChange}
                        className="h-12 text-lg"
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ NOVA SEÇÃO: OPÇÕES DE FRETE */}
              {store.settings.shippingSettings?.enabled && customerInfo.state && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Opções de Frete</h3>
                      <p className="text-gray-600 text-sm">Escolha como deseja receber seu pedido</p>
                    </div>
                  </div>

                  {calculatingShipping ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                      <span className="text-gray-600">Calculando opções de frete...</span>
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
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedShipping?.id === option.id
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          onClick={() => handleShippingChange(option)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedShipping?.id === option.id
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                              }`}>
                              {selectedShipping?.id === option.id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{option.name}</h4>
                              <p className="text-sm text-gray-600">{option.deliveryDays}</p>
                              {option.description && (
                                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                              )}
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
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Preencha o estado para ver as opções de frete
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                style={{
                  backgroundColor: store.theme.primaryColor,
                  background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                }}
              >
                <span>Continuar para Pagamento</span>
                <CreditCard size={20} className="ml-2" />
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Order Confirmation */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Confirmação do Pedido</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Informações Pessoais</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nome:</strong> {customerInfo.name}</p>
                      <p><strong>Email:</strong> {customerInfo.email}</p>
                      <p><strong>Telefone:</strong> {customerInfo.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Endereço de Entrega</h4>
                    <div className="space-y-2 text-sm">
                      {customerInfo.address && <p>{customerInfo.address}</p>}
                      {(customerInfo.city || customerInfo.state) && (
                        <p>{customerInfo.city}{customerInfo.city && customerInfo.state ? ', ' : ''}{customerInfo.state}</p>
                      )}
                      {customerInfo.zipCode && <p>CEP: {customerInfo.zipCode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Pagamento via PIX</h3>
                    <p className="text-gray-600 text-sm">Aprovação instantânea e segurança garantida</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">PIX - Pagamento Instantâneo</p>
                      <p className="text-gray-600 text-sm">
                        Pague usando PIX e tenha aprovação na hora. Mais rápido e seguro!
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <Zap size={16} />
                      <span>Aprovação Imediata</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <Shield size={16} />
                      <span>100% Seguro</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-purple-600">
                      <Truck size={16} />
                      <span>Agiliza a Entrega</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="space-y-4">
                <Button
                  onClick={handlePlaceOrder}
                  className="w-full py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  disabled={loading}
                  style={{
                    backgroundColor: store.theme.primaryColor,
                    background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.secondaryColor} 100%)`
                  }}
                >
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando seu pedido...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Lock size={20} />
                      <span>Finalizar Pedido com PIX</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-4 text-lg font-semibold rounded-xl border-2"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Voltar para Informações
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}