'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Check, Clock, Download, MessageCircle, Package, ShoppingBag, Tag, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { PixPayment } from './PixPayment';
import { orderServiceNew } from '@/lib/firebase/firestore-new';

interface OrderConfirmationProps {
  store: Store;
  orderId: string;
}

export function OrderConfirmation({ store, orderId }: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        // ✅ ALTERAÇÃO: Usar orderServiceNew com storeId
        const orderData = await orderServiceNew.getOrder(store.id, orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, store.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Carregando confirmação do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Não Encontrado</h1>
        <p className="text-gray-600 mb-6">
          Não foi possível encontrar o pedido solicitado.
        </p>
        <Link href={`/${store.slug}`}>
          <Button style={{ backgroundColor: store.theme.primaryColor }}>
            Voltar para a Loja
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ✅ HERO SECTION - Destaque Visual */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
          <Check size={40} className="text-white" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Pedido Confirmado! 🎉
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Obrigado pela sua compra! Seu pedido foi recebido e está sendo processado.
        </p>

        {/* ✅ NÚMERO DO PEDIDO DESTACADO */}
        <div className="bg-gray-900 text-white rounded-xl p-4 inline-block">
          <p className="text-sm opacity-90 mb-1">Número do Pedido</p>
          <p className="text-xl font-mono font-bold">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ✅ MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* ✅ PIX PAYMENT - Destaque Máximo */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
              <h2 className="text-xl font-bold flex items-center">
                <Zap size={24} className="mr-3 text-yellow-400" />
                Pagamento via PIX
              </h2>
              <p className="text-gray-300 mt-1">
                Complete seu pagamento para liberar o pedido
              </p>
            </div>
            <div className="p-6">
              <PixPayment
                store={store}
                amount={order.total}
                orderId={order.id}
              />
            </div>
          </div>

          {/* ✅ DETALHES DO PEDIDO */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Package size={20} className="mr-2 text-blue-600" />
              Detalhes do Pedido
            </h3>

            {/* ✅ PRODUTOS COM DESIGN MODERNO */}
            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                      {item.productName}
                    </p>
                    {item.variant && (
                      <p className="text-gray-600 text-xs mt-1">
                        {item.variant.optionName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.total || item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ RESUMO DE VALORES OTIMIZADO */}
            <div className="border-t pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.breakdown?.subtotal || order.total)}</span>
                </div>

                {order.shipping && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete</span>
                    <span className={order.shipping.cost === 0 ? 'text-green-600 font-semibold' : 'text-gray-900'}>
                      {order.shipping.cost === 0 ? 'Grátis 🎁' : formatPrice(order.shipping.cost)}
                    </span>
                  </div>
                )}

                {order.discount && order.discount.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <Tag size={14} className="mr-1" />
                      Cupom {order.discount.couponCode}
                    </span>
                    <span className="font-semibold">- {formatPrice(order.discount.discountAmount)}</span>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ SIDEBAR INFORMACIONAL */}
        <div className="space-y-6">
          {/* ✅ INFORMAÇÕES DE CONTATO */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User size={18} className="mr-2 text-blue-600" />
              Seus Dados
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Contato</p>
                <p className="text-gray-900">{order.customerInfo.name}</p>
                <p className="text-gray-600 text-sm">{order.customerInfo.email}</p>
                <p className="text-gray-600 text-sm">{order.customerInfo.phone}</p>
              </div>

              {order.customerInfo.address && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Entrega</p>
                  <div className="text-gray-600 text-sm space-y-1">
                    <p>{order.customerInfo.address}</p>
                    {(order.customerInfo.city || order.customerInfo.state) && (
                      <p>{order.customerInfo.city}{order.customerInfo.city && order.customerInfo.state ? ', ' : ''}{order.customerInfo.state}</p>
                    )}
                    {order.customerInfo.zipCode && <p>CEP: {order.customerInfo.zipCode}</p>}
                  </div>
                </div>
              )}

              {order.shipping && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Previsão de entrega:</strong><br />
                    {order.shipping.estimatedDelivery}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ SUPORTE RÁPIDO */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={20} className="text-white" />
              </div>
              <h4 className="font-semibold text-green-900 mb-2">Precisa de ajuda?</h4>
              <p className="text-green-700 text-sm mb-4">
                Nossa equipe está aqui para te ajudar
              </p>
              {store.contact.whatsapp && (
                <a
                  href={`https://wa.me/${store.contact.whatsapp}?text=Olá! Tenho uma dúvida sobre o pedido ${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors"
                >
                  <MessageCircle size={16} className="mr-2" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* ✅ AÇÕES RÁPIDAS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Ações</h4>
            <div className="space-y-3">
              <Link href={`/${store.slug}`} className="block">
                <Button variant="outline" className="w-full justify-center">
                  <ShoppingBag size={16} className="mr-2" />
                  Continuar Comprando
                </Button>
              </Link>

              <Button className="w-full justify-center" style={{ backgroundColor: store.theme.primaryColor }}>
                <Download size={16} className="mr-2" />
                Salvar Comprovante
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}