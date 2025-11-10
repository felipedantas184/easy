'use client';
import { useState, useEffect } from 'react';
import { Store } from '@/types/store';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Check, Clock, Download } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto">
      {/* Header de Confirmação */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pedido Confirmado!
        </h1>
        <p className="text-gray-600">
          Obrigado por sua compra. Seu pedido foi recebido com sucesso.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
          <p className="text-sm text-blue-800">
            <strong>Número do Pedido:</strong> {order.id}
          </p>
        </div>
      </div>

      {/* Informações do Pedido */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalhes do Pedido</h2>

        {/* Informações do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-2">Informações de Contato</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Nome:</strong> {order.customerInfo.name}</p>
              <p><strong>Email:</strong> {order.customerInfo.email}</p>
              <p><strong>Telefone:</strong> {order.customerInfo.phone}</p>
            </div>
          </div>

          {order.customerInfo.address && (
            <div>
              <h3 className="font-medium mb-2">Endereço de Entrega</h3>
              <div className="text-sm text-gray-600">
                <p>{order.customerInfo.address}</p>
                {order.customerInfo.city && order.customerInfo.state && (
                  <p>{order.customerInfo.city}, {order.customerInfo.state}</p>
                )}
                {order.customerInfo.zipCode && (
                  <p>CEP: {order.customerInfo.zipCode}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Itens do Pedido */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Itens do Pedido</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  {item.variant && (
                    <p className="text-sm text-gray-600">{item.variant.optionName}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Quantidade: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Instruções de Pagamento PIX */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <PixPayment
          store={store}
          amount={order.total}
          orderId={order.id}
        />
      </div>

      {/* Contato da Loja */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Dúvidas?</h3>
        <p className="text-blue-700 text-sm mb-3">
          Entre em contato com a loja através dos canais abaixo:
        </p>
        <div className="space-y-2 text-sm">
          {store.contact.whatsapp && (
            <p>
              <strong>WhatsApp:</strong>{' '}
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {store.contact.whatsapp}
              </a>
            </p>
          )}
          {store.contact.email && (
            <p>
              <strong>Email:</strong> {store.contact.email}
            </p>
          )}
          {store.contact.phone && (
            <p>
              <strong>Telefone:</strong> {store.contact.phone}
            </p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href={`/${store.slug}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Continuar Comprando
          </Button>
        </Link>

        <Button className="flex-1" style={{ backgroundColor: store.theme.primaryColor }}>
          <Download size={18} className="mr-2" />
          Salvar Comprovante
        </Button>
      </div>
    </div>
  );
}