'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Order } from '@/types/order';
import { storeService } from '@/lib/firebase/firestore';
import { orderService } from '@/lib/firebase/firestore';
import { Store } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Eye, Package, Search } from 'lucide-react';
import { orderServiceNew } from '@/lib/firebase/firestore-new';

export default function OrdersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (selectedStoreId) {
        try {
          setLoading(true);
          // ✅ USAR ORDER SERVICE NOVO
          const storeOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
          setOrders(storeOrders);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadOrders();
  }, [selectedStoreId]);

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // ✅ ALTERAÇÃO: Usar orderServiceNew com storeId
      await orderServiceNew.updateOrderStatus(selectedStoreId, orderId, newStatus);
      // Recarregar pedidos
      const updatedOrders = await orderServiceNew.getStoreOrders(selectedStoreId);
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  if (stores.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gerencie os pedidos das suas lojas</p>
        </div>

        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma loja criada
          </h3>
          <p className="text-gray-600 mb-6">
            Você precisa criar uma loja para receber pedidos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os pedidos das suas lojas
          </p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="bg-white rounded-lg border p-6">
        <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Loja
        </label>
        <select
          id="store-select"
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      {/* Orders */}
      {selectedStoreId && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-gray-200 rounded"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                Esta loja ainda não recebeu pedidos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Pedido #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600">
                        {order.customerInfo.name} • {order.customerInfo.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
                      <div className="flex space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status === 'pending' && 'Pendente'}
                          {order.status === 'confirmed' && 'Confirmado'}
                          {order.status === 'preparing' && 'Preparando'}
                          {order.status === 'shipped' && 'Enviado'}
                          {order.status === 'delivered' && 'Entregue'}
                          {order.status === 'cancelled' && 'Cancelado'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus === 'pending' && 'Pagamento Pendente'}
                          {order.paymentStatus === 'confirmed' && 'Pago'}
                          {order.paymentStatus === 'failed' && 'Falhou'}
                          {order.paymentStatus === 'refunded' && 'Estornado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4 mb-4">
                    <h4 className="font-medium mb-2">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.productName}
                            {item.variant && ` - ${item.variant.optionName}`}
                            <span className="text-gray-500"> × {item.quantity}</span>
                          </span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p><strong>Telefone:</strong> {order.customerInfo.phone}</p>
                      {order.customerInfo.address && (
                        <p><strong>Endereço:</strong> {order.customerInfo.address}</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Confirmar Pedido
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                        >
                          Em Preparação
                        </Button>
                      )}

                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                        >
                          Marcar como Enviado
                        </Button>
                      )}

                      {order.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          Marcar como Entregue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}